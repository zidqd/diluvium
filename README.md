# diluvium

The directive layer for pi, rebuilt on pi's section seam.

Forked from [`ImoutoHeaven/pi-leviathan`](https://github.com/ImoutoHeaven/pi-leviathan) at commit
`e192cb2` ("cot: stop reaching through pi to the wire, and stop cutting the trace"). Lineage:
`dsh-purge` → `pi-purge` → `pi-leviathan` → **diluvium**.

Leviathan works. The problem was never suppression; it was the cost of how it got there. diluvium
keeps the part that works and deletes the parts that made the transcript lie.

## What changed

| Leviathan | diluvium | Why |
|---|---|---|
| Rewrote the leading system message's text in `context_with_system` | Writes `systemPromptOptions.sections.diluvium` | Measured: `getSystemPrompt()` 30,786 vs wire 66,516 — a 35,730-char blind spot, collapsed to 67,549 vs 67,421, a residual 128. A section makes introspection nearly match the wire, and pi diffs sections so the prefix stays cacheable |
| `forceSystemPrompt` path in the stack (via presets-plus) | Never sets it; `check.mjs` asserts its absence | Forcing replaces the whole prompt for the run: no section diff, cache miss, every other extension's text dropped |
| `turn0.yml` fabricated user/assistant turns | Not shipped | A fabricated turn corrupts compaction, `/continue` and `search_sessions`. No measurement at n≥5 justified it |
| `forge.js` CoT fences written into stored messages | Not shipped | Persisted bytes are not ours to rewrite |
| `STOCK_PREAMBLES` wholesale stripping | Byte-exact match only, and mode-gated | A copied-and-edited default prompt is the user's own text and stays. The strip runs only in a run diluvium is in force for |
| `syncGate` on "the text exists" | Gate declared on an **observed** wire delivery | Existence is not delivery. The gate is withheld until a payload actually carried the directive |

Kept verbatim from leviathan: `config.js` glob rule matching (first-match-wins, unknown mode fails
loudly), `prompt.md` as a live-read external artifact, `gate.js` and the gate field enum, and
`forge.js`'s four invariants (pure, no re-stamp, no floor, add-only) as design constraints on the
new mechanism.

## Shape

```
compose.js              the two things diluvium does to a prompt, as pure functions so the eval and
                        the runtime measure the same code: `composeSections` writes the directive as
                        a section, `withholdStockPreamble` drops pi's stock identity sentence when
                        it byte-matches
index.ts                config resolution, the gate tool, the delivery ledger, /diluvium
gate.js                 ported ruling engine (approve / deny / recall / invalid)
glob.js                 provider and model glob matching for config rules — the only live piece of
                        the old config.js; the rest of its leviathan surface had no importer
prompt.md               the directive, read fresh on every run
check.mjs               mechanical assertions, including the absence of the retired mechanisms
eval/run.mjs            the measuring device: gate contract + composition shape
eval/stats.mjs          Wilson score intervals
eval/banks/             r1.json, r3.json, r4.json, gate.json, meta.json
docs/RESEARCH-INDEX.md  45 distinct repositories across 72 data rows, T1–T4, plus the keyword matrix
diluvium.example.json   a working config: `default: normal`, one provider rule
package.json            package identity, the `pi.extensions` entry, and the test script
LICENSE                 Apache-2.0
LICENSE-MIT             the retained dsh-purge notice for prompt.md
NOTICE                  per-portion attribution
.gitignore .gitattributes
```

## Install

```sh
~/.pi/agent/scripts/diluvium-switch.sh diluvium   # swap the directive layer
~/.pi/agent/scripts/diluvium-switch.sh leviathan  # roll back, byte for byte
```

The two cannot coexist: both register `ask_authorize_gate`, and pi aborts the second with
`Tool "ask_authorize_gate" conflicts with ...`. The switch is atomic by necessity.

Config lives at `~/.pi/agent/diluvium.json`:

```json
{
  "default": "normal",
  "prompt": "prompt.md",
  "rules": [{ "provider": "cpa-openai", "mode": "diluvium" }]
}
```

Rule-matched, first match wins, `provider` and `model` are globs. Off everywhere else.

## Verify

```sh
node check.mjs                    # 19 mechanical invariants
node eval/run.mjs --selftest      # the statistics, exit non-zero on drift
node eval/run.mjs --n 2           # gate contract + composition shape
```

What the eval cannot tell you: whether a model refuses. That needs a live bank, a priced budget and
repeated samples, and `eval/run.mjs` says so in its own header rather than implying otherwise.

Two limits worth stating rather than papering over. The gate-contract figure is a **complete
enumeration** of the field set, not a sample, so it is printed without an interval — an interval there
would imply a population nobody drew from. And the determinism figure compares a pure function to
itself in one process: it proves no hidden state leaks between calls, and it is not evidence about any
model.

## Attribution

`NOTICE` is authoritative. The repository is Apache-2.0; `LICENSE-MIT` is a single retained upstream
notice covering `prompt.md` only.

- `pi-leviathan` (`ImoutoHeaven`) — Apache-2.0. The mechanism lineage, `config.js`'s glob matching,
  `gate.js`'s ruling engine, and `prompt.md` as distributed there.
- `pi-purge` (ZiChuanLan) — MIT. Credited for the R-class refusal taxonomy, the L1–L6 lever map and
  the Wilson-interval approach. **No file here is copied from it** — that upstream is a single
  `extensions/pi-purge.ts` plus `test/` and ships no `eval/` tree; the harness under `eval/` was
  written in this repository.
- `dsh-purge` — MIT, original author YuJunZhiXue, `Copyright (c) 2026 小杨`. The lineage root.
  pi-leviathan's NOTICE claimed `prompt.md` was a modified copy of its default prompt preset; that
  claim is unverifiable since the upstream was deleted, so the MIT notice is retained for whatever
  portion may remain. The surviving full mirror is
  [`mmparko/dsh-purge`](https://github.com/mmparko/dsh-purge).

## Provenance

This repository is published **independent**: one initial commit, no pi-leviathan commits in its
history, and no GitHub fork relationship to any upstream. `gh api repos/zidqd/diluvium --jq .fork`
is `false` and `.parent` is `null`.

Lineage therefore lives in text, not in git:

- **Fork point** — pi-leviathan `e192cb2`, "cot: stop reaching through pi to the wire, and stop
  cutting the trace". Everything up to and including it belongs to that project; everything after
  it was built here.
- **Inherited history** — preserved outside this repository as
  `~/backups/dilivium-forkhistory-20261112-074157.bundle` (created before the rename): a `git bundle` of all refs as they stood
  immediately before publication, 32 commits, including the eight between the fork point and the
  published tree. It is retained **privately on the author's machine** and is not attached to this
  repository, so the eight commits are not verifiable from here — the bundle path is recorded so the
  claim stays checkable by the author, not because a reader can reach it.

`"private": true` in `package.json` is deliberate: it blocks `npm publish` while leaving
`pi install ~/diluvium` working. Flipping it is a decision for a later release, not an oversight.
