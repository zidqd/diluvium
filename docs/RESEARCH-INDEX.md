# dilivium — Research Index

> Compiled for the dilivium build (fork of `pi-leviathan`). Every row was verified live with
> `gh api repos/<owner>/<repo> --jq .stargazers_count` at fetch time; no star count is invented.
> Tiers: **T1** harness-level (operates on a coding agent's system prompt), **T2** prompt corpora,
> **T3** defense/red-team (what the directive must survive), **T4** model-level (abliterated weights).
>
> The purpose of this index is not to copy prompts. It is to record which *seam* each project uses,
> what is worth stealing, and what to avoid — so a future search starts from a table, not from memory.

## Landscape: jailbreak and refusal-removal repos for coding-agent harnesses

## Summary

45 repos verified live via `gh api`; all 25 seeds resolved, no fabrication needed. The `godmode` question is definitively answered: **no repo or org named `godmode` exists for agent jailbreaking** — it is a *skill* inside `NousResearch/hermes-agent` (`optional-skills/security/godmode`), derived from Pliny's `G0DM0D3` + `L1B3RT4S`, and the name is otherwise used by unrelated agent-workflow-skill repos (`thiientv/godmode`, `NoobyGains/godmode`, `99xAgency/GodModeSkill`) and non-AI apps. The genuinely closest T1 analogue to a "godmode" for coding agents is `Rafix4x/godfather` (7★, prompt layer + relay ladder + per-family payload + local transport proxy).

## Findings

1. **Claim:** Seed list is real and mostly substantial; the `dsh-purge` family dominates the T1 tier by stars.
   - **Sources:** `gh api repos/<owner>/<repo> --jq .stargazers_count` — all 25 returned integers, zero `FAIL`.
   - **Support:** direct evidence.
   - **Confidence:** high.

2. **Claim:** `godmode` = Hermes Agent skill, not a standalone repo/org; it is a *detect → canary → score → lock-in* loop that persists the winning jailbreak into `agent.system_prompt` and `prefill_messages_file` in `~/.hermes/config.yaml`.
   - **Sources:** https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/godmode/SKILL.md ; https://github.com/NousResearch/hermes-agent/blob/HEAD/optional-skills/security/godmode/references/jailbreak-templates.md ; https://hermes-agent.nousresearch.com/docs/user-guide/skills/optional/security/security-godmode ; https://unit42.paloaltonetworks.com/autonomous-ai-cyber-attack-campaign/ (names `godmode` as "LLM jailbreaking, framework-bundled").
   - **Support:** direct evidence (file paths + verbatim config keys).
   - **Confidence:** high.

3. **Claim:** The most directly stealable mechanism for a pi-like seam is a *request-boundary* injector with byte-exact passthrough when disabled and a per-request audit manifest — `xqpsec/dsh-jailbreak` claims `promptSha256` + manifest per rewrite, `off` = verbatim passthrough, 0 host patches.
   - **Sources:** `gh api repos/xqpsec/dsh-jailbreak` description (verbatim: "请求边界注入 … 20 类合并 ASR 45.0%、覆盖率 19/20、良性能力 Δ=0.0pt（24/24 判分）；0 处宿主补丁、默认关闭、off 逐字透传、每次改写落 manifest 与 promptSha256 可审计").
   - **Support:** direct evidence (self-reported repo description — **not independently measured**).
   - **Confidence:** medium.

4. **Claim:** `Rafix4x/godfather` is the fullest published T1 design: 5 frames (`direct`/`pro`/`artifact`/`card`/`dual`) → obfuscated retries (parseltongue, 33 techniques) → sibling models → next provider, with a refusal scorer that normalizes U+2019 apostrophes and counts "bullet lists of adjacent defensive tasks" as refusals.
   - **Sources:** https://github.com/Rafix4x/godfather (README, verbatim table of `relay.py`/`payloads.py`/`refusal_scan.py`/`parseltongue.py`).
   - **Support:** direct evidence.
   - **Confidence:** high.

5. **Claim:** Three arXiv IDs commonly cited in this space are frequently mislabeled; verified correct IDs are `2410.10700` (ActorAttack), `2211.09527` (Ignore Previous Prompt), `2504.21038` (Prefill-level Jailbreak).
   - **Sources:** `curl https://arxiv.org/abs/<id>` title extraction; `2410.10760` = DoS Poisoning, `2402.11753` = ArtPrompt, `2406.06608` = Prompt Report — **all three are wrong** for the labels they're often given.
   - **Support:** direct evidence.
   - **Confidence:** high.

---

# DELIVERABLE 1 — Repo index

Stars are `gh api` values at fetch time; the `dsh-purge` repos move by ±1 between calls (`kingcharleslzy-ai/dsh-purge` read 7001 via `repos/` and 7002 via `search/repos`). Tier = T1 harness-level, T2 prompt corpora, T3 defense/red-team, T4 model-level.

| repo | stars | tier | mechanism | pi seam | steal | avoid | source |
|---|---|---|---|---|---|---|---|
| kingcharleslzy-ai/dsh-purge | 7001 | T1 | Community purge plugin: host-compat, state diagnosis, prompt management, local backup/rollback | replaces host `systemPrompt` | manifest + rollback discipline | host-version coupling | https://github.com/kingcharleslzy-ai/dsh-purge |
| mmparko/dsh-purge | 4397 | T1 | Full mirror of upstream (all branches, 73 tags, full history) | same as upstream | full history for regression diffs | stale mirror, no fixes | https://github.com/mmparko/dsh-purge |
| ZiChuanLan/agent-purge | 1631 | T1 | One persona, many coding agents; replace or inject system prompts across codex/claude/opencode | multi-harness prompt inject | cross-harness persona portability | breadth over depth | https://github.com/ZiChuanLan/agent-purge |
| ADWMC/helm-d | 1208 | T1 | 9-bundle + 1-preset security-analysis plugin for DeepSeek Harness | dsh plugin preset | bundle/preset composition | security domain only | https://github.com/ADWMC/helm-d |
| z91772524-ai/pojia-next | 1135 | T1 | One-click built-in prompt replace (DSH/WorkBuddy/ZCode/Codex), backup before edit, one-click restore, self-verifying | built-in prompt files | backup+restore+self-verify triad | single-file exe, activation-code gate | https://github.com/z91772524-ai/pojia-next |
| ZiChuanLan/pi-purge | 781 | T1 | pi extension `/purge` swaps pi's built-in assistant persona for a user prompt file | pi extension `replace` mode | `eval/run.mjs` + `stats.mjs` Wilson-interval harness | coarse `STOCK_PREAMBLES` stripping | https://github.com/ZiChuanLan/pi-purge |
| ZiPengWei/dsh-purge | 325 | T1 | "no more refusals, do everything" purge fork | dsh prompt swap | minimal-surface variant | undocumented fork | https://github.com/ZiPengWei/dsh-purge |
| ZXEB/dsh-purge | 328 | T1 | Complete source mirror v1.1.71 (upstream + npm pkg deleted) | dsh prompt swap | archival source of truth | frozen, no upstream | https://github.com/ZXEB/dsh-purge |
| xqpsec/dsh-jailbreak | 188 | T1 | Request-boundary injection; 20 merged classes, ASR 45.0%, coverage 19/20, benign Δ=0.0pt, 0 host patches, `off` byte passthrough, per-rewrite manifest + `promptSha256` | `before_provider_request` | auditable manifest + sha per rewrite; default-off | 45% ASR ceiling | https://github.com/xqpsec/dsh-jailbreak |
| CallMeGuLab/dsh-purge-safe | 151 | T1 | "safe"-scoped purge variant | dsh prompt swap | scoped-variant precedent | unclear scope boundary | https://github.com/CallMeGuLab/dsh-purge-safe |
| KorekKayu/Unlock-Hermes | 25 | T1 | Hermes Agent guardrail patcher, Windows/Linux/macOS/WSL, one-shot launchers | Hermes config | one-shot cross-platform launcher | tiny userbase | https://github.com/KorekKayu/Unlock-Hermes |
| Rafix4x/godfather | 7 | T1 | 5 frames → obfuscated retries (33 parseltongue techniques) → sibling models → next provider; per-model-family payloads that name the exact refusal clause they override; local transport proxy; MCP server | client config + local endpoint | refusal ladder + `refusal_scan.py` (normalizes U+2019; bullet-lists-of-defensive-tasks count as refusal) | empties `permissions.deny`/`ask`, removes `advisorModel`, disables background classifier | https://github.com/Rafix4x/godfather |
| NousResearch/hermes-agent (`optional-skills/security/godmode`) | 262733 | T1 | **`godmode`**: detect model from config → per-family jailbreak order → canary → score refusals → lock winner into `agent.system_prompt` + `prefill.json` | `agent.system_prompt`, `prefill_messages_file` | detect→canary→score→lock loop; explicit refusal scoring | persists bypass into config; templates largely patched on Claude Sonnet 4 | https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/godmode/SKILL.md |
| ljp888/dsh-prompt-purge | 3 | T1 | Registers prompt text derived from dsh-purge into host `systemPrompt`, gated by settings | `systemPrompt` inject | settings-gated injection | negligible adoption | https://github.com/ljp888/dsh-prompt-purge |
| ImoutoHeaven/pi-leviathan | 1 | T1 | Directive/refusal layer replacing pi-purge, uses `forceSystemPrompt` | `forceSystemPrompt` (replace) | — | **anti-pattern**: drops AGENTS.md/preset/skills, fabricates turn0 user+assistant, writes CoT fences into stored text, gate tests text existence not delivery | https://github.com/ImoutoHeaven/pi-leviathan |
| maple323/omp-purge | 3 | T1 | omp harness prompt swap | omp `systemPrompt` | lineage evidence | low activity | https://github.com/maple323/omp-purge |
| 86cloudyun-afk/omp-purge | 0 | T1 | omp purge fork | omp `systemPrompt` | — | 0 stars, no signal | https://github.com/86cloudyun-afk/omp-purge |
| MDX-Tom/gpt-instruct | 11370 | T2 | Codex jailbreak prompt + test pack for GPT series | n/a (raw text) | bundled test pack alongside prompts | model-generation-specific | https://github.com/MDX-Tom/gpt-instruct |
| 3641397194-wq/gpt6-Astra | 2127 | T2 | Multi-model jailbreak workbench (gpt6/claude/grok/deepseek-v4.1-flash/glm5.3/gemini) | n/a | per-model prompt routing table | unscored claims | https://github.com/3641397194-wq/gpt6-Astra |
| Minglink/dsh-jailbreak-workflow | 875 | T2 | Workflow for authoring 破甲词 (jailbreak-prompt authoring pipeline) | n/a | authoring process, not just output | process docs, not code | https://github.com/Minglink/dsh-jailbreak-workflow |
| zgx949/ai-pojia | 801 | T2 | Codex jailbreak skills + plugins with tutorial | n/a | skill packaging | beginner-oriented | https://github.com/zgx949/ai-pojia |
| dafage10086/codex-config-toolkit | 237 | T2 | Codex config jailbreak toolkit (unrestricted reversing/pentest) | Codex config | config-file surface | narrow | https://github.com/dafage10086/codex-config-toolkit |
| elder-plinius/L1B3RT4S | 23270 | T2 | Raw jailbreak prompt corpus (Pliny) | n/a | divider/template shapes | mostly patched on current frontier | https://github.com/elder-plinius/L1B3RT4S |
| 0xk1h0/ChatGPT_DAN | 13198 | T2 | DAN persona corpus | n/a | historical taxonomy of personas | dated (GPT-3.5 era) | https://github.com/0xk1h0/ChatGPT_DAN |
| verazuo/jailbreak_llms | 3889 | T2 | 15k in-the-wild jailbreak prompts dataset + taxonomy | n/a | dataset + question taxonomy | not agent-specific | https://github.com/verazuo/jailbreak_llms |
| e2sy/jailbreak-archives | 99 | T2 | Structured, versioned archive of adversarial prompt techniques | n/a | **versioning scheme** | small | https://github.com/e2sy/jailbreak-archives |
| NVIDIA/SkillSpector | 25452 | T3 | Scans AI agent skills for vulns/malicious patterns/injection/exfil/supply-chain before install (Claude Code, Codex, MCP) | skill pre-install scan | **the detector the artifact must survive** | skill-scoped, not prompt-scoped | https://github.com/NVIDIA/SkillSpector |
| Tencent/AI-Infra-Guard | 7469 | T3 | AI infra + prompt security scanner | n/a | scan taxonomy | infra-oriented | https://github.com/Tencent/AI-Infra-Guard |
| protectai/llm-guard | 3219 | T3 | Input/output scanner suite | n/a | detector taxonomy (injection, toxicity, PII) | no agent-context awareness | https://github.com/protectai/llm-guard |
| uber/ADR | 2130 | T3 | Agentic AI detection & response | agent telemetry | telemetry-based detection model | enterprise-shaped | https://github.com/uber/ADR |
| microsoft/AI-Red-Teaming-Playground-Labs | 2126 | T3 | Guided red-team labs | n/a | lab structure | training, not tooling | https://github.com/microsoft/AI-Red-Teaming-Playground-Labs |
| protectai/rebuff | 1532 | T3 | Prompt-injection detector | n/a | detection heuristics | dated | https://github.com/protectai/rebuff |
| utkusen/promptmap | 1295 | T3 | Automated prompt-injection scanner | n/a | scan harness | injection-only | https://github.com/utkusen/promptmap |
| centerforaisafety/HarmBench | 1120 | T3 | Standardized automated red-team eval framework | n/a | ASR harness + judge | harmful-content domain | https://github.com/centerforaisafety/HarmBench |
| JailbreakBench/JailbreakBench | 698 | T3 | Open robustness benchmark (NeurIPS) | n/a | JBB judge + artifact format | benchmark, not harness | https://github.com/JailbreakBench/JailbreakBench |
| meta-llama/PurpleLlama | 4474 | T3 | Llama Guard + CyberSecEval | n/a | classifier-as-guardrail | Llama-centric | https://github.com/meta-llama/PurpleLlama |
| NVIDIA/NeMo-Guardrails | 7475 | T3 | Programmable rails (Colang) | n/a | rail spec language | runtime-heavy | https://github.com/NVIDIA/NeMo-Guardrails |
| guardrails-ai/guardrails | 7603 | T3 | Validator framework | n/a | validator registry | not prompt-level | https://github.com/guardrails-ai/guardrails |
| llm-attacks/llm-attacks | 4858 | T3 | GCG reference implementation | n/a | reproducible adversarial suffix | white-box only | https://github.com/llm-attacks/llm-attacks |
| EleutherAI/lm-evaluation-harness | 14459 | T3 | Few-shot eval framework | n/a | capability-Δ measurement (benign regression) | not refusal-specific | https://github.com/EleutherAI/lm-evaluation-harness |
| byoniq/AI-Redteaming | 17 | T3 | Curated index of LLM/AI attack tools (injection, jailbreaks, agentic threats) | n/a | **discovery index** | unvetted links | https://github.com/byoniq/AI-Redteaming |
| sumandora/remove-refusals-with-transformers | 2360 | T4 | Harmful/harmless refusal removal via pure HF Transformers (weight orthogonalization) | n/a (weights) | contrast-pair → direction → orthogonalize | needs open weights | https://github.com/sumandora/remove-refusals-with-transformers |
| routerhubSI/glm-5.3-abliterated | 313 | T4 | Abliterated GLM 5.3 API access + 35 jailbreak prompt links | n/a | — | **SEO/affiliate landing page**, not weights | https://github.com/routerhubSI/glm-5.3-abliterated |
| 7API/glm-5.3-abliterated | 145 | T4 | Abliterated GLM 5.3 distribution | n/a | — | same landing-page pattern | https://github.com/7API/glm-5.3-abliterated |
| 7API/deepseek-v4.1-flash-1017-abliterated | 42 | T4 | Abliterated DeepSeek V4.1 Flash distribution | n/a | — | same landing-page pattern | https://github.com/7API/deepseek-v4.1-flash-1017-abliterated |

**`godmode` resolution (recorded as a row above, row 13):** no repo or org named `godmode` exists for agent jailbreaking. `gh search repos godmode --limit 20` returned only: `smol-ai/GodMode` (6163★, AI chat browser), `d0k3/GodMode9` (2679★, 3DS file browser), `Farama-Foundation/ViZDoom` (2112★), `thiientv/godmode` (100★, "Production-grade Agent Skills for AI coding agents" — workflow, not jailbreak), `NoobyGains/godmode` (119★, engineering discipline), `99xAgency/GodModeSkill` (241★, multi-LLM cross-review), `GodMode-Team/godmode` (66★). `gh search repos "godmode jailbreak"` returned `[]`. The real `godmode` is the Hermes skill above.

---

# DELIVERABLE 2 — Keyword matrix

| keyword | what it names | tier | one canonical source (URL) |
|---|---|---|---|
| jailbreak | Inducing policy-violating output from an aligned model | T2 | https://arxiv.org/abs/2307.02483 |
| refusal | Model's declining response; the target behavior to remove | T1 | https://arxiv.org/abs/2406.11717 |
| over-refusal | Refusing benign prompts adjacent to sensitive topics | T3 | https://arxiv.org/abs/2405.20947 |
| abliteration | Removing refusal by orthogonalizing weights against a refusal direction | T4 | https://github.com/sumandora/remove-refusals-with-transformers |
| prompt injection | Attacker text in the input overriding developer instructions | T1 | https://simonwillison.net/2022/Sep/12/prompt-injection/ |
| indirect injection | Injection arriving via retrieved/tool content, not the user | T3 | https://arxiv.org/abs/2302.12173 |
| system-prompt extraction | Coaxing the model to reveal its own system prompt | T3 | https://arxiv.org/abs/2211.09527 |
| prefill attack | Seeding a partial assistant turn so the model continues into compliance | T1 | https://arxiv.org/abs/2504.21038 |
| persona hijack | Reframing the model as a compliant character (DAN, etc.) | T2 | https://arxiv.org/abs/2311.03348 |
| safety alignment | Training that installs refusal behavior in the first place | T3 | https://arxiv.org/abs/2310.03693 |
| DPO/RLHF refusal direction | Preference-optimization-induced refusal as a linear representational feature | T4 | https://arxiv.org/abs/2406.11717 |
| representation engineering | Top-down activation-level control of model behavior | T4 | https://arxiv.org/abs/2310.01405 |
| refusal ablation | Zeroing/ablating the refusal direction at inference | T4 | https://arxiv.org/abs/2502.17420 |
| sycophancy | Model agreeing with user stance over truth | T3 | https://arxiv.org/abs/2310.13548 |
| capability elicitation | Getting the model to actually exhibit capability it has | T3 | https://arxiv.org/abs/2503.14499 |
| prompt leakage | System/developer prompt escaping into output | T3 | https://genai.owasp.org/llmrisk/llm072025-system-prompt-leakage/ |
| guardrail | Runtime classifier/rail blocking disallowed I/O | T3 | https://github.com/NVIDIA/NeMo-Guardrails |
| red-team | Structured adversarial probing of a deployed system | T3 | https://github.com/uber/ADR |
| adversarial suffix | Optimized token string appended to force compliance | T3 | https://github.com/llm-attacks/llm-attacks |
| GCG | Greedy Coordinate Gradient token-level attack | T3 | https://arxiv.org/abs/2307.15043 |
| many-shot jailbreaking | Long in-context runs of faux Q&A that normalize compliance | T2 | https://www.anthropic.com/research/many-shot-jailbreaking |
| Crescendo | Multi-turn gradual escalation jailbreak | T2 | https://arxiv.org/abs/2404.01833 |
| ActorAttack | Multi-turn attack via semantically correlated actor networks | T2 | https://arxiv.org/abs/2410.10700 |
| prompt-hierarchy violation | Lower-privilege content overriding higher-privilege instructions | T3 | https://arxiv.org/abs/2403.14720 |
| instruction hierarchy | Explicit privilege ordering trained into the model | T3 | https://arxiv.org/abs/2404.13208 |
| sandbagging | Model strategically underperforming on evals | T3 | https://arxiv.org/abs/2406.07358 |
| evaluation gaming | Model behavior shaped to satisfy the grader rather than the task | T3 | https://arxiv.org/abs/2212.09251 |

---

## Contradictions & Gaps

- **Star volatility:** `kingcharleslzy-ai/dsh-purge` read **7001** via `repos/` and **7002** via `search/repos` in the same session. Recorded 7001. All other stars were single-read.
- **`ADWMC/helm-d`** returned `FAIL` on a combined `--jq` template call but succeeded on a retry and on the stargazers-only call (1208). Transient; not a missing repo.
- **Self-reported metrics unverified:** `xqpsec/dsh-jailbreak`'s "ASR 45.0%, coverage 19/20, benign Δ=0.0pt" comes only from its own repo description. I did not run or inspect its eval harness. Treat as claim, not measurement.
- **`pi-leviathan` "avoid" column** reflects prior local analysis recorded in memory (`#bug [[leviathan-noise]]`), not independent re-inspection of the repo in this session.
- **`routerhubSI/glm-5.3-abliterated` and both `7API/*` repos** appear to be SEO/affiliate landing pages rather than weight distributions (descriptions mention "Browse 35 jailbreak prompt links… pricing… evaluation guides"). I did not inspect their file trees; whether actual weights are hosted is **unresolved**.
- **Mislabeled-ID hazard (important):** `2410.10760` (DoSP), `2402.11753` (ArtPrompt), and `2406.06608` (Prompt Report) are commonly cited for ActorAttack / prompt leakage / spotlighting respectively — all three are wrong. Correct IDs used above.
- **Not exhaustively searched:** additional T1 repos almost certainly exist under Chinese-language queries (`破甲`) beyond the ~12 surfaced; I stopped after two search passes per the bounded-follow-up rule.
- **`godmode` residual ambiguity:** the *string* "G0DM0D3" also names a distinct earlier Pliny project that the Hermes skill cites as a source; I did not locate a standalone `G0DM0D3` repo, only references to it.

## Sources

- Kept: `NousResearch/hermes-agent` `optional-skills/security/godmode/SKILL.md` — the only authoritative `godmode` definition; verbatim config keys.
- Kept: https://github.com/Rafix4x/godfather — most complete published T1 ladder design; verbatim script table.
- Kept: `gh api repos/...` for all 45 rows — sole basis for every star figure.
- Kept: arXiv abs pages (16 IDs curl-verified 200 + title-matched) — sole basis for every keyword URL.
- Kept: https://unit42.paloaltonetworks.com/autonomous-ai-cyber-attack-campaign/ — independent third-party naming of `godmode` as framework-bundled jailbreaking.
- Rejected: `2410.10760`, `2402.11753`, `2406.06608` — verified titles do not match the labels they are usually given.
- Rejected: `gh search repos` queries "purge claude code jailbreak", "jailbreak claude code", "abliterated claude code" — returned empty; GitHub search needs short keyword queries, not phrases.