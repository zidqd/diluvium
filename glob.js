/**
 * Provider and model glob matching for config rules.
 *
 * This is the one live piece of the old `config.js`. Everything else that file exported was
 * leviathan-era vocabulary (`CONFIG_NAME`, `MODES`, `INHERITS`, `FORGE_MODES`, `PI_LEVIATHAN_CONFIG`,
 * `parseConfig`) with no importer, so the module was deleted rather than renamed: a second source of
 * truth for the mode vocabulary is worse than a missing one.
 */

/** `*` matches any run of characters; every other character matches itself. Case-insensitive. */
export function globMatch(pattern, value) {
	const escaped = String(pattern)
		.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		.replace(/\\\*/g, ".*");
	return new RegExp(`^${escaped}$`, "i").test(String(value));
}
