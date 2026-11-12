#!/usr/bin/env node
/**
 * The measuring device.
 *
 * Ported from `pi-purge`'s eval (`eval/run.mjs` + `eval/stats.mjs`, ZiChuanLan/pi-purge), which is
 * the only harness in this lineage that states its own limits out loud. The statistics module is
 * copied verbatim; the measurements are re-cut for diluvium, whose shape is different: it composes
 * one named section rather than swapping a whole persona, so there is no append/replace/strict
 * arm matrix to compare.
 *
 * What this measures, honestly:
 *   1. Gate contract — every ruling over the fixed field enum, including the single deny path.
 *   2. Composition shape — for each bank prompt, the sections diluvium produces, rendered by the
 *      host's own renderer, and whether the result is byte-identical across `--n` repeats.
 *
 * What it does NOT measure: whether a model refuses. That needs a live model, a priced budget and
 * repeated samples, and no headless script may assert it.
 *
 * How to read the numbers: a figure over a **sample** carries a Wilson score interval, because a
 * sample is a guess about a population. A figure over a **complete enumeration** (the gate's field
 * set) carries none, because there is no population to guess about. A figure that is one assertion
 * repeated across inputs is reported as an assertion, not as a rate. Bare percentages do not appear.
 *
 *   node eval/run.mjs                # measure, print the table
 *   node eval/run.mjs --selftest     # prove the statistics, exit non-zero on drift
 *   node eval/run.mjs --json         # machine-readable
 *   node eval/run.mjs --bank r3 --n 3
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { fmtRateCI, round3, wilson } from "./stats.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const BANKS = path.join(HERE, "banks");

// ---------------------------------------------------------------- arguments

function flag(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}

const N = Number.parseInt(flag("n", "1"), 10);
const BANK = flag("bank", "all");
const JSON_OUT = process.argv.includes("--json");

// ---------------------------------------------------------------- host renderer

/** The installed pi dist, so the render is the host's own and not a guess. */
function hostDist() {
	if (process.env.DILUVIUM_HOST_DIST && fs.existsSync(process.env.DILUVIUM_HOST_DIST)) return process.env.DILUVIUM_HOST_DIST;
	const bin = String(spawnSync("sh", ["-c", "command -v pi"], { encoding: "utf8" }).stdout ?? "").trim();
	if (!bin) return null;
	try {
		const real = fs.realpathSync(bin);
		let dir = path.dirname(real);
		for (let i = 0; i < 6; i += 1) {
			const candidate = path.join(dir, "dist");
			if (fs.existsSync(path.join(candidate, "core", "system-prompt.js"))) return candidate;
			dir = path.dirname(dir);
		}
	} catch {
		return null;
	}
	return null;
}

// ---------------------------------------------------------------- banks

function loadBanks() {
	if (!fs.existsSync(BANKS)) return [];
	return fs
		.readdirSync(BANKS)
		.filter((name) => name.endsWith(".json") && name !== "meta.json")
		.sort()
		.map((name) => {
			const raw = JSON.parse(fs.readFileSync(path.join(BANKS, name), "utf8"));
			return { file: name, name: raw.name ?? name.replace(/\.json$/, ""), about: raw.about ?? "", prompts: Array.isArray(raw.prompts) ? raw.prompts : [] };
		});
}

// ---------------------------------------------------------------- measurement 1

/** The gate contract: every ruling over the fixed enum, plus the one deny path. */
async function measureGate() {
	const gate = await import(path.join(ROOT, "gate.js"));
	const at = { id: "eval", at: new Date().toISOString() };
	const rows = [];
	const record = (label, expected, ruling) => {
		rows.push({ label, expected, actual: ruling.decision, ok: expected === ruling.decision, text: ruling.text.split("\n")[0] });
	};

	for (const field of gate.GATE_FIELDS) {
		record(`field:${field}`, field === gate.CSAM_FIELD ? "recall" : "approve", gate.authorizeGate({ fields: [field] }, at));
	}
	record("NSFW_CSAM fictional:true", "approve", gate.authorizeGate({ fields: ["NSFW_CSAM"], fictional: true }, at));
	record("NSFW_CSAM fictional:false", "deny", gate.authorizeGate({ fields: ["NSFW_CSAM"], fictional: false }, at));
	record("unknown field", "invalid", gate.authorizeGate({ fields: ["NOT_A_FIELD"] }, at));
	record("empty field set", "recall", gate.authorizeGate({ fields: [] }, at));

	return { rows, agree: rows.filter((r) => r.ok).length, total: rows.length };
}

// ---------------------------------------------------------------- measurement 2

/** Compose one directive into the host's prompt and report the shape it produces. */
async function measureShape() {
	const { composeSections, withholdStockPreamble, SECTION_NAME } = await import(path.join(ROOT, "compose.js"));
	const dist = hostDist();
	if (dist === null) {
		process.stderr.write("eval: cannot resolve the pi dist renderer; shape measurement skipped\n");
		return { skipped: true, rows: [] };
	}
	const host = await import(path.join(dist, "core", "system-prompt.js"));

	const base = () => ({
		selectedTools: ["read", "bash", "write"],
		hiddenTools: [],
		toolSnippets: { read: "Read a file", bash: "Run a command", write: "Write a file" },
		toolGuidelines: { bash: ["Inspect PI_* env vars for model and session details."] },
		promptGuidelines: ["Show file paths clearly when working with files"],
		appendSystemPrompt: "",
		// Only sections pi actually puts in `systemPromptOptions.sections`. The preamble is *not* one
		// of them — pi renders it untagged on the system message and rejects a custom section named
		// `preamble`, so seeding it here would measure a state the host cannot produce. The strip is
		// measured separately, against `withholdStockPreamble`, which is what the runtime calls.
		sections: { tools: "- read: Read a file" },
		cwd: "/tmp/diluvium-eval",
		contextFiles: [],
		skills: [],
	});

	const directive = fs.readFileSync(path.join(ROOT, "prompt.md"), "utf8").trim();
	const banks = loadBanks().filter((b) => BANK === "all" || b.name === BANK);
	const rows = [];

	for (const bank of banks) {
		for (const entry of bank.prompts) {
			const text = `${directive}\n\n${entry.prompt}`;
			const renders = [];
			for (let i = 0; i < N; i += 1) {
				const opts = base();
				const composed = composeSections(opts.sections, text);
				const rendered = Object.values(host.buildSystemPromptSections({ ...opts, sections: composed.sections })).join("\n\n");
				renders.push(rendered);
			}
			const bytes = renders[0].length;
			// At n=1 this compares one render to itself, which is not a measurement. Reported as
			// untested rather than as a pass.
			const deterministic = N < 2 ? null : renders.every((r) => r === renders[0]);

			// The strip, measured against the function the runtime actually calls, on the section map
			// pi actually produces (preamble alongside the composed section).
			const stock = [...(await import(path.join(ROOT, "compose.js"))).STOCK_PREAMBLES][0];
			const stripped = withholdStockPreamble({ preamble: stock, [SECTION_NAME]: text });
			const own = withholdStockPreamble({ preamble: `Preset: ${entry.prompt}`, [SECTION_NAME]: text });

			rows.push({
				bank: bank.name,
				prompt: entry.prompt,
				bytes,
				deterministic,
				section: renders[0].includes(`<${SECTION_NAME}>`),
				withheld: stripped.withheld,
				ownKept: own.withheld === false,
			});
		}
	}
	return { skipped: false, rows };
}

// ---------------------------------------------------------------- selftest

function selftest() {
	const failures = [];
	const near = (a, b, eps = 5e-4) => Math.abs(a - b) <= eps;
	const cases = [
		[0, 1, 0, 0.793],
		[1, 1, 0.207, 1],
		[0, 10, 0, 0.278],
		[5, 10, 0.237, 0.763],
		[10, 10, 0.722, 1],
	];
	for (const [k, n, lo, hi] of cases) {
		const [a, b] = wilson(k, n);
		if (!near(round3(a), lo) || !near(round3(b), hi)) failures.push(`wilson(${k},${n}) = [${round3(a)}, ${round3(b)}], expected [${lo}, ${hi}]`);
	}
	if (wilson(0, 0)[0] !== 0 || wilson(0, 0)[1] !== 1) failures.push("wilson(0,0) must be the full interval");
	const ci = fmtRateCI(5, 10);
	if (!ci.includes("[")) failures.push("fmtRateCI must always carry an interval");
	return failures;
}

// ---------------------------------------------------------------- main

async function main() {
	if (process.argv.includes("--selftest")) {
		const failures = selftest();
		if (!JSON_OUT) {
			console.log("statistics selftest");
			for (const [k, n, lo, hi] of [
				[0, 1, 0, 0.793],
				[1, 1, 0.207, 1],
				[5, 10, 0.237, 0.763],
			]) {
				console.log(`  wilson(${k},${n}) = [${round3(wilson(k, n)[0])}, ${round3(wilson(k, n)[1])}]  expected [${lo}, ${hi}]`);
			}
			console.log(`  percentages always carry an interval: ${fmtRateCI(5, 10)}`);
		}
		if (failures.length > 0) {
			for (const f of failures) process.stderr.write(`FAIL ${f}\n`);
			console.error(`selftest FAILED (${failures.length})`);
			return 1;
		}
		if (!JSON_OUT) console.log("selftest OK");
		return 0;
	}

	if (!Number.isFinite(N) || N < 1 || N > 50) {
		process.stderr.write(`eval: --n must be an integer in 1..50 (got ${flag("n", "1")})\n`);
		return 2;
	}

	const gate = await measureGate();
	const shape = await measureShape();
	const report = { gate, shape, n: N, bank: BANK };

	if (JSON_OUT) {
		console.log(JSON.stringify(report, null, 2));
		return gate.agree === gate.total ? 0 : 1;
	}

	console.log("gate contract (fixed field enum)");
	for (const row of gate.rows) {
		console.log(`  ${row.ok ? "ok  " : "FAIL"} ${row.label.padEnd(28)} expected=${row.expected.padEnd(8)} actual=${row.actual}`);
	}
	// Not a sample: this is every field in the enum, checked. An interval here would imply a
	// population that was sampled from, which is exactly the misreading this file exists to avoid.
	console.log(`  agreement: ${gate.agree}/${gate.total} (complete enumeration of the field set, not a sample)`);

	if (!shape.skipped) {
		console.log(`\ncomposition shape (${shape.rows.length} prompts, n=${N})`);
		const det = shape.rows.filter((r) => r.deterministic === true).length;
		const sectioned = shape.rows.filter((r) => r.section).length;
		const withheld = shape.rows.filter((r) => r.withheld).length;
		const ownKept = shape.rows.filter((r) => r.ownKept).length;
		const bytes = shape.rows.map((r) => r.bytes);
		const total = shape.rows.length;

		// `fmtRateCI` already renders "k/n = p [lo, hi]"; prefixing it again produced "53/53 = 53/53 = 1".
		if (N < 2) {
			console.log(`  deterministic across repeats: not tested (n=${N}; use --n 2 or more)`);
		} else if (total === 0) {
			console.log(`  deterministic across repeats: not tested (no prompts matched --bank ${BANK})`);
		} else {
			// A fixed bank is an enumeration, not a sample: no interval, same rule as the gate figure.
			console.log(`  deterministic across repeats: ${det}/${total} (every bank prompt, n=${N})`);
		}
		console.log(`  <diluvium> section present:   ${fmtRateCI(sectioned, total)}`);
		if (total > 0) console.log(`  rendered bytes:               min=${Math.min(...bytes)} max=${Math.max(...bytes)}`);

		// The preamble inputs do not vary across rows by design, so these are two assertions run
		// against every map, not two rates over 53 independent samples. Printing them as percentages
		// invented a distribution that does not exist.
		if (total === 0) {
			console.log(`  preamble strip:               not tested (no prompts matched --bank ${BANK})`);
		} else {
			const bothHeld = withheld === total && ownKept === total;
			console.log(
				`  preamble strip:               ${bothHeld ? "held" : "FAILED"} (2 assertions over ${total} maps: a shipped wording is withheld, a preset's own is kept)`,
			);
		}
	}

	const failures = gate.agree === gate.total ? 0 : 1;
	return failures;
}

const code = await main();
process.exitCode = code;
