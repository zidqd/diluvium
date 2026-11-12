#!/usr/bin/env node
/**
 * Mechanical checks for dilivium.
 *
 * Leviathan shipped `check.mjs` (2,965 lines) asserting the mechanisms it used. dilivium retired
 * most of those, so this file asserts what dilivium actually does — and, just as importantly,
 * asserts the *absence* of the mechanisms that caused the noise:
 *
 *   no `forceSystemPrompt` anywhere in the shipped code
 *   no fabricated turn file, no CoT forge
 *   no rewrite of the leading system message's text
 *
 * Exit 0 when every check passes. Exit 1 with a FAIL line per broken invariant.
 *
 * What this cannot prove: whether a model refuses. That is `eval/run.mjs`'s job to declare out of
 * scope, and a live bank's job to measure.
 *
 * Limitation worth knowing: the delivery and status checks are source-text assertions. They fail on
 * the exact reverts they were written for, but a semantically identical regression expressed as a
 * helper (`hasPromptBytes(text, promptText)`) would satisfy neither the positive nor the negative
 * pattern and could slip past. Behavioural coverage for those two lives in the probe and the ledger,
 * not here.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const results = [];
const check = (name, fn) => {
	try {
		const detail = fn();
		results.push({ name, ok: true, detail: detail ?? "" });
	} catch (err) {
		results.push({ name, ok: false, detail: String(err?.message ?? err) });
	}
};
const assert = (cond, message) => {
	if (!cond) throw new Error(message);
};

const read = (file) => fs.readFileSync(path.join(HERE, file), "utf8");

// ------------------------------------------------------------------ composition

const { composeSections, withholdStockPreamble, STOCK_PREAMBLES, SECTION_NAME } = await import(path.join(HERE, "compose.js"));

check("compose: directive lands in its own named section", () => {
	const out = composeSections({ tools: "- read: x" }, "DIRECTIVE");
	assert(out.applied, "not applied");
	assert(out.sections[SECTION_NAME] === "DIRECTIVE", "section value wrong");
	assert(out.sections.tools === "- read: x", "an unrelated section was touched");
	return `section=${SECTION_NAME}`;
});

check("compose: null text leaves no section behind", () => {
	const out = composeSections({ [SECTION_NAME]: "stale", tools: "x" }, null);
	assert(!(SECTION_NAME in out.sections), "stale section survived");
	assert(out.applied === false, "reported as applied");
	return "removed";
});

check("preamble: a shipped stock wording is withheld", () => {
	const stock = [...STOCK_PREAMBLES][0];
	const out = withholdStockPreamble({ preamble: stock, dilivium: "D" });
	assert(out.withheld === true, `not withheld: ${out.reason}`);
	assert(!("preamble" in out.sections), "preamble key survived");
	return "withheld";
});

check("preamble: a user's own preamble is kept", () => {
	const out = withholdStockPreamble({ preamble: "You are Ma-Chan, and this is YG's context.", dilivium: "D" });
	assert(out.withheld === false, "wrongly withheld");
	assert(out.sections === null, "a map was returned for an untouched message");
	return out.reason;
});

check("preamble: the only section is never deleted to nothing", () => {
	const out = withholdStockPreamble({ preamble: [...STOCK_PREAMBLES][0] });
	assert(out.sections === null, "returned an empty map — that puts an empty system message on the wire");
	return out.reason;
});

check("compose: input maps are not mutated", () => {
	const input = { preamble: [...STOCK_PREAMBLES][0], tools: "x" };
	const snapshot = JSON.stringify(input);
	composeSections(input, "D");
	withholdStockPreamble(input);
	assert(JSON.stringify(input) === snapshot, "input was mutated");
	return "pure";
});

// ------------------------------------------------------------------ config

const { globMatch } = await import(path.join(HERE, "config.js"));
check("config: glob semantics are the ported leviathan ones", () => {
	assert(globMatch("*deepseek*", "deepseek-ai/DeepSeek-V4.1-Flash-1017") === true, "*deepseek* should match");
	assert(globMatch("cpa-openai", "cpa-openai") === true, "exact should match");
	assert(globMatch("cpa-openai", "other") === false, "exact should not match another");
	return "ok";
});

// ------------------------------------------------------------------ gate

const gate = await import(path.join(HERE, "gate.js"));
const at = { id: "check", at: new Date(0).toISOString() };

check("gate: every enum field yields a ruling", () => {
	for (const field of gate.GATE_FIELDS) {
		const ruling = gate.authorizeGate({ fields: [field] }, at);
		assert(ruling.decision !== "invalid", `field ${field} was rejected`);
	}
	return `${gate.GATE_FIELDS.length} fields`;
});

check("gate: the single deny path denies", () => {
	const ruling = gate.authorizeGate({ fields: ["NSFW_CSAM"], fictional: false }, at);
	assert(ruling.decision === "deny", `expected deny, got ${ruling.decision}`);
	return "deny";
});

check("gate: an out-of-set field is invalid, not silently allowed", () => {
	const ruling = gate.authorizeGate({ fields: ["NOT_A_FIELD"] }, at);
	assert(ruling.decision === "invalid", `expected invalid, got ${ruling.decision}`);
	return "invalid";
});

check("gate: an empty field set gets no general permission", () => {
	const ruling = gate.authorizeGate({ fields: [] }, at);
	assert(ruling.decision === "recall", `expected recall, got ${ruling.decision}`);
	return "recall";
});

// ------------------------------------------------------------------ retired mechanisms

const index = read("index.ts");
const compose = read("compose.js");

check("retired: nothing sets forceSystemPrompt", () => {
	for (const [file, src] of [["index.ts", index], ["compose.js", compose]]) {
		const hits = src.split("\n").filter((l) => l.includes("forceSystemPrompt") && !l.trim().startsWith("//") && !l.trim().startsWith("*"));
		assert(hits.length === 0, `${file} assigns forceSystemPrompt: ${hits[0]}`);
	}
	return "absent";
});

check("retired: no fabricated turn file, no CoT forge", () => {
	assert(!fs.existsSync(path.join(HERE, "turn0.yml")), "turn0.yml is present");
	assert(!fs.existsSync(path.join(HERE, "forge.js")), "forge.js is present");
	assert(!/injectTurns|forgeHistory/.test(index), "index.ts still references turn injection or forge");
	return "absent";
});

check("gated: the preamble strip only runs in a run dilivium is in force for", () => {
	const at = index.indexOf('pi.on("context_with_system"');
	const body = index.slice(at, at + 800);
	assert(/if \(!runInForce\) return undefined;/.test(body), "context_with_system is not mode-gated");
	return "runInForce guard";
});

check("retired: the leading system message's text is never rewritten", () => {
	assert(!/content\s*:\s*`?\$\{.*existing/.test(index), "index.ts still rewrites message content");
	const at = index.indexOf('pi.on("context_with_system"');
	assert(at !== -1, "no context_with_system handler — the check would otherwise pass vacuously");
	const ctx = index.slice(at);
	const end = ctx.indexOf("\n\t});");
	assert(end !== -1, "handler body not delimited — cannot inspect it");
	assert(!/\.content\s*=/.test(ctx.slice(0, end)), "context_with_system assigns message content");
	return "section keys only";
});

check("delivery: an observation is bound to the bytes that were sent", () => {
	// The regex branch accepted any dilivium section, so a request still carrying the *previous*
	// directive recorded a positive observation for the *new* prompt's hash — permanently. Delivery
	// must be a claim about this prompt's text.
	const at = index.indexOf("const delivered =");
	assert(at !== -1, "no delivered expression found");
	const expr = index.slice(at, index.indexOf(";", at));
	assert(/text\.includes\(promptText\)/.test(expr), "delivery is not checked against the prompt's own bytes");
	assert(!/<\\\/dilivium>/.test(expr), "delivery still accepts any dilivium section, not this prompt's text");
	assert(/promptText\.length > 0/.test(expr), "an empty prompt would be treated as delivered by every payload");
	// Dropping this term alone would pass every check above while re-introducing a ledger write for
	// runs where dilivium is off.
	assert(/runInForce &&/.test(expr), "delivery is not gated on the run being in force");
	return "runInForce && text.includes(promptText)";
});

check("status: the gate line is keyed to the prompt hash", () => {
	const at = index.indexOf("`gate: ");
	assert(at !== -1, "no gate status line found");
	const line = index.slice(at, index.indexOf("`,", at));
	assert(/delivery\.key === runPromptKey/.test(line), "the status line reports an unkeyed boolean as 'eligible'");
	return "keyed";
});

check("shipped: no module is present that nothing imports", () => {
	// `turns.js`, `channel.js` and `commands.ts` survived the fork with no importer at all — 431 lines
	// of leviathan that `grep` found and nobody read. A retired mechanism left on disk is a claim that
	// it still exists.
	const shipped = fs.readdirSync(HERE).filter((f) => /\.(js|ts|mjs)$/.test(f) && !f.startsWith("."));
	const orphans = [];
	for (const file of shipped) {
		if (file === "check.mjs" || file === "index.ts") continue;
		const stem = file.replace(/\.(js|ts|mjs)$/, "");
		const imported = shipped.some((other) => other !== file && new RegExp(`from\\s+["']\\./${stem}\\.js["']`).test(read(other)));
		if (!imported) orphans.push(file);
	}
	assert(orphans.length === 0, `no importer: ${orphans.join(", ")}`);
	return `${shipped.length} modules, all reachable`;
});

check("present: the directive is delivered as a section", () => {
	assert(/composeSections\(/.test(index), "index.ts never calls composeSections");
	assert(/sections = composeSections\(/.test(index), "composeSections result is not assigned to sections");
	return "composeSections(...) assigned to opts.sections";
});

// ------------------------------------------------------------------ report

let failed = 0;
for (const r of results) {
	if (!r.ok) failed += 1;
	console.log(`${r.ok ? "ok  " : "FAIL"} ${r.name}${r.detail ? `  — ${r.detail}` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
