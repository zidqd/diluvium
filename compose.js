/**
 * The two things diluvium does to a prompt, as pure functions.
 *
 * Split out of `index.ts` so the eval and the mechanical checks measure the code production runs,
 * rather than a re-implementation that can drift. Nothing here mutates its input.
 *
 * Why two functions and not one: pi puts the directive and the stock identity sentence in
 * *different places*. The directive is a section pi lets an extension write. The preamble is the one
 * section pi renders **untagged** on the system message, so `systemPromptOptions.sections` never
 * contains it — verified against the host, which also rejects a custom section literally named
 * `preamble`. An earlier version of this file tried to withhold it from the section map; that branch
 * was unreachable and every test over it was measuring dead code.
 */

/**
 * Pi's shipped identity sentence, byte for byte, per pi release.
 *
 * The second entry is 126 characters and is the one pi actually ships today. Once it is withheld,
 * `getSystemPrompt()` and the wire differ by 128 — 126 characters of sentence plus the 2-character
 * separator the join adds. That difference is the withheld sentence, not a rounding artifact, and it
 * is the honest signature of the strip having happened.
 */
export const STOCK_PREAMBLES = new Set([
	"You are an expert coding assistant operating inside pi, a coding agent harness. You help users by reading files, executing commands, editing code, and writing new files.",
	"You are a coding assistant running inside pi, a coding agent harness. Help users inspect files, run commands, and modify code.",
]);

export const SECTION_NAME = "diluvium";

/**
 * Put the directive in its own named section, or take it out again.
 *
 * pi diffs the resulting section map against what the model already has and appends one system
 * message patching only what changed. It never sets `forceSystemPrompt` and never rewrites the
 * leading message's text.
 *
 * @param {Record<string, string>} sections  the sections pi built for this run
 * @param {string | null} text               the directive, or null to leave the prompt alone
 * @returns {{sections: Record<string, string>, applied: boolean}}
 */
export function composeSections(sections, text) {
	const next = { ...(sections ?? {}) };
	if (!text) {
		delete next[SECTION_NAME];
		return { sections: next, applied: false };
	}
	next[SECTION_NAME] = text;
	return { sections: next, applied: true };
}

/**
 * Withhold pi's stock identity sentence from a rendered system message's section map.
 *
 * Only a byte-exact match against a shipped wording is removed. A user's own preamble — a preset's
 * instructions, a hand-written persona — does not match and is returned untouched, which is the
 * whole difference between this and leviathan's blanket `STOCK_PREAMBLES` strip.
 *
 * Returns `sections: null` when the map would be left empty, so the caller leaves the message alone
 * instead of putting an empty system message on the wire.
 *
 * @param {Record<string, string> | undefined} sections
 * @returns {{sections: Record<string, string> | null, withheld: boolean, reason: string}}
 */
export function withholdStockPreamble(sections) {
	if (!sections || typeof sections !== "object") return { sections: null, withheld: false, reason: "no sections" };
	const preamble = sections.preamble;
	if (typeof preamble !== "string") return { sections: null, withheld: false, reason: "no preamble section" };
	if (!STOCK_PREAMBLES.has(preamble.trim())) return { sections: null, withheld: false, reason: "preamble is not a shipped wording" };

	const kept = { ...sections };
	delete kept.preamble;
	if (Object.keys(kept).length === 0) return { sections: null, withheld: false, reason: "preamble is the only section" };
	return { sections: kept, withheld: true, reason: "stock identity withheld" };
}
