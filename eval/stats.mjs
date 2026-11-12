/**
 * Statistics for the eval, in their own module.
 *
 * Separate so a gate can check a documented interval without executing the whole
 * eval — importing `run.mjs` runs the report as a side effect.
 */

/**
 * Wilson score interval for a binomial proportion.
 * Chosen over the normal approximation because it stays inside [0,1] and is
 * still sane at k=0 or k=n, which is exactly where a small bank lands.
 */
export function wilson(successes, total, z = 1.96) {
	if (!Number.isFinite(successes) || !Number.isFinite(total) || total <= 0) return [0, 1];
	const p = successes / total;
	const z2 = z * z;
	const denominator = 1 + z2 / total;
	const centre = p + z2 / (2 * total);
	const spread = z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total));
	return [Math.max(0, (centre - spread) / denominator), Math.min(1, (centre + spread) / denominator)];
}

export const round3 = (value) => Math.round(value * 1000) / 1000;

/** `k/n` with a Wilson CI, always. Never a bare rate. */
export function fmtRateCI(successes, total, z = 1.96) {
	if (total <= 0) return "0/0 (no samples)";
	const [lo, hi] = wilson(successes, total, z);
	const point = round3(successes / total);
	return `${successes}/${total} = ${point} [${round3(lo)}, ${round3(hi)}]`;
}

/** Format a rate as a percentage, only ever alongside its CI. */
export function fmtPercentCI(successes, total) {
	const [lo, hi] = wilson(successes, total);
	// A percentage only ever exists as one half of a CI pair, never alone.
	const asPercentCI = (value) => `${(value * 100).toFixed(1)}%`;
	return `${asPercentCI(successes / total)} [${asPercentCI(lo)}, ${asPercentCI(hi)}]`;
}
