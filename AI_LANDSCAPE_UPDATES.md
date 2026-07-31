# AI Landscape Updates
_Last refreshed: 2026-07-31_

First edition — no prior report to diff against. Scope: roughly the last 4-8 weeks (early June through July 30, 2026), plus active betas and credible announced-but-unshipped items.

## 🚀 New & recently shipped

### Claude Opus 5 (Anthropic)
- **What changed:** Shipped July 24, 2026. Frontier-class agentic coding/computer-use model at unchanged Opus pricing; adaptive thinking on by default; new five-level `effort` control (low/medium/high/xhigh/max, defaults to `high` on API and Claude Code).
- **How to use it now:**
  - API: model ID `claude-opus-5`, endpoint `POST https://api.anthropic.com/v1/messages`. 1M-token context (default and max), 128K max output on the sync Messages API (300K via Batch API with beta header `output-300k-2026-03-24`).
  - Pricing: $5/MTok in, $25/MTok out; up to 90% off with prompt caching, 50% off batch.
  - Also available via Amazon Bedrock (`anthropic.claude-opus-5`), Google Cloud Vertex, Microsoft Foundry, and Claude Platform on AWS.
  - Docs: `platform.claude.com/docs/en/get-started` for first API call; migration notes at `/docs/en/about-claude/models/migration-guide`.
- **Source:** [Claude models overview](https://platform.claude.com/docs/en/about-claude/models/overview), [MarkTechPost on Opus 5](https://www.marktechpost.com/2026/07/24/meet-the-new-claude-opus-5-frontier-class-agentic-coding-and-computer-use-at-unchanged-opus-pricing/)

### GPT-5.6 — Sol / Terra / Luna (OpenAI)
- **What changed:** Broad rollout began July 9, 2026 across ChatGPT, Codex, and the API. Sol is the flagship/coding tier, Terra is balanced, Luna is the cheap/fast tier. On July 30, OpenAI cut Luna pricing 80% and Terra pricing 20%.
- **How to use it now:**
  - API access: available now for all three tiers through the standard OpenAI API (set `model` to the Sol/Terra/Luna identifiers in your account's model picker — check `platform.openai.com/docs/models` for exact current IDs, since OpenAI renames tiers frequently).
  - Codex: the standalone Codex app has merged into the ChatGPT desktop app (macOS/Windows) as of July 9; Codex keeps its own coding surface. Multi-agent "V2" mode and Bedrock login are supported.
  - ChatGPT: Terra/Luna available under Work/Codex plans depending on tier.
- **Source:** [OpenAI: GPT-5.6](https://openai.com/index/gpt-5-6/) (via search index), [explainx.ai rollout summary](https://www.explainx.ai/blog/gpt-5-6-release-date-features-benchmarks-2026), [Codex July update](https://releasebot.io/updates/openai/codex)

### Gemini 3.6 Flash, 3.5 Flash-Lite, 3.5 Flash Cyber (Google DeepMind)
- **What changed:** Shipped July 21, 2026. 3.6 Flash is the new default "workhorse" — 17% fewer output tokens than 3.5 Flash, fewer tool-call/reasoning-loop iterations, priced at $1.50/MTok in and $7.50/MTok out. 3.5 Flash-Lite is the cheapest tier. 3.5 Flash Cyber is a vulnerability-hunting variant restricted to governments/trusted partners (pilot only). No Gemini 3.5 Pro in this drop.
- **How to use it now:**
  - Gemini API via Google AI Studio (`aistudio.google.com`) — pick `gemini-3.6-flash` in the model selector, or call the API directly with an AI Studio key.
  - Also exposed in Android Studio for in-IDE use.
- **Source:** [Google blog: Introducing Gemini 3.6 Flash, 3.5 Flash-Lite, 3.5 Flash Cyber](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/), [9to5Google](https://9to5google.com/2026/07/21/gemini-3-6-flash-launch/)

### Grok 4.5 (xAI / SpaceXAI)
- **What changed:** Public launch July 8-16, 2026 — xAI's first flagship since SpaceX absorbed the company (now trading as SPCX). Positioned as "Opus-class but faster and cheaper."
- **How to use it now:**
  - API: $2/MTok in, $6/MTok out, 500K context, $0.50/MTok cached input. Web/X search tool calls bill separately at $5 per 1,000 calls. No free tier, but $175/month in free credits available through xAI's data-sharing program.
  - Consumer: full access requires SuperGrok Heavy ($300/mo, $99/mo intro); the $30/mo tier gets staged rollout at 128K context.
- **Source:** [Requesty: Grok 4.5 pricing](https://www.requesty.ai/models/xai/grok-4.5), [eesel AI pricing breakdown](https://www.eesel.ai/blog/grok-4-5-pricing)

### Meta Model API + Muse Spark 1.1 (Meta)
- **What changed:** July 9, 2026 — Meta's first-ever paid, self-serve model API (previously Llama access was open-weight only). Muse Spark 1.1 is a multimodal reasoning/agentic model priced at roughly 1/4 of OpenAI/Anthropic rates.
- **How to use it now:**
  - Join the public-preview waitlist (US developers first) at [developer.meta.com/ai/products/meta-model-api](https://developer.meta.com/ai/products/meta-model-api/).
  - Generate a key from the Model API dashboard, export as `MODEL_API_KEY`.
  - Base URL `api.meta.ai/v1`; the API speaks both OpenAI Chat Completions/Responses format and Anthropic Messages format — pass `model: "muse-spark-1.1"`.
  - Pricing: $1.25/MTok in, $4.25/MTok out, $0.15 cached input; $20 free credits per new account; 1M context window.
- **Source:** [Meta: Build with Muse Spark](https://developer.meta.com/ai/resources/blog/build-with-muse-spark/), [the-decoder pricing analysis](https://the-decoder.com/metas-muse-spark-1-1-api-pricing-squeezes-openai-and-anthropic-as-the-ai-price-war-heats-up/)

### Inkling (Thinking Machines Lab)
- **What changed:** July 15/16, 2026 — first open-weights model from Mira Murati's Thinking Machines Lab. 975B params (41B active, MoE), Apache 2.0, native multimodal (text/image/audio), 1M context, trained on 45T tokens.
- **How to use it now:**
  - Download weights from Hugging Face: [`thinkingmachines/Inkling`](https://huggingface.co/thinkingmachines/Inkling) (bf16, Hopper+ GPUs) or [`thinkingmachines/Inkling-NVFP4`](https://huggingface.co/thinkingmachines/Inkling-NVFP4) (Blackwell-optimized). A smaller sibling, [`Inkling-Small`](https://huggingface.co/thinkingmachines/Inkling-Small) (276B/12B active), is also available.
  - To fine-tune instead of self-host inference: use Thinking Machines' Tinker platform — install the `tml-renderers` package and follow the Tinker Cookbook.
- **Source:** [Hugging Face: Welcome Inkling](https://huggingface.co/blog/thinkingmachines-inkling), [Thinking Machines model card](https://thinkingmachines.ai/model-card/inkling/), [ghacks coverage](https://www.ghacks.net/2026/07/16/thinking-machines-lab-releases-inkling-a-975-billion-parameter-open-weights-ai-model-under-apache-2-0/)

### MCP spec 2026-07-28 (Anthropic / Model Context Protocol steering group)
- **What changed:** Final spec shipped July 28, 2026 after a 10-week validation window. Protocol core is now stateless by default, adds Multi Round-Trip Requests, header-based routing, cacheable list results, hardened OAuth/OIDC authorization, and a formal extensions framework. Dynamic Client Registration deprecated in favor of CIMD (old flow still works). Tasks moved out of core into an extension; Roots/Sampling/Logging deprecated (12-month support window).
- **How to use it now:**
  - All four Tier-1 SDKs (TypeScript, Python, Java/Kotlin, C#) already speak 2026-07-28 — bump your SDK to the latest release.
  - Read the migration notes before upgrading servers that rely on long-lived sessions or Roots/Sampling.
  - Claude, Claude Code, and Claude Desktop already support the new spec per Anthropic's July changelog.
- **Source:** [MCP blog: The 2026-07-28 Specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/), [The Register coverage](https://www.theregister.com/devops/2026/07/23/model-context-protocol-prepares-to-break-with-its-stateful-past/5276722)

### Grok Build (xAI)
- **What changed:** Terminal coding agent (like Claude Code / Codex CLI), open-sourced under Apache 2.0. Supports plan-mode review, diffs, `AGENTS.md`, skills, plugins, hooks, MCP, parallel subagents, worktrees, and the Agent Client Protocol (ACP) for embedding in other tools.
- **How to use it now:**
  - Install: `curl -fsSL https://x.ai/cli/install.sh | bash` (macOS/Linux) or `irm https://x.ai/cli/install.ps1 | iex` (Windows).
  - Run `grok` for interactive TUI or `grok exec "task"` for one-shot execution.
  - Auth: browser sign-in on first launch (needs SuperGrok/X Premium+), or headless via `GROK_CODE_XAI_API_KEY="xai-..."`.
  - Source code: [github.com/xai-org/grok-build](https://github.com/xai-org/grok-build).
- **Source:** [xAI: Introducing Grok Build](https://x.ai/news/grok-build-cli), [codersera install guide](https://codersera.com/blog/how-to-install-grok-build-cli-2026/)

### Windsurf → Devin Desktop (Cognition)
- **What changed:** Windsurf rebranded to Devin Desktop (rolled out as an OTA update starting June 2, 2026). Default surface is now an "Agent Command Center" Kanban board instead of the editor canvas. Cascade (the old local agent) hit end-of-life July 1 and was replaced by Devin Local (Rust rewrite, ~30% better token efficiency, subagents, sandboxing). Supports the open Agent Client Protocol for plugging in third-party agents.
- **How to use it now:** Existing Windsurf installs auto-update; new installs at Cognition's site sign in the same way. Configure MCP tool permissions and plan-mode sandbox settings from the new Agent Command Center.
- **Source:** [webdeveloper.com rebrand coverage](https://webdeveloper.com/news/windsurf-devin-desktop-cascade-eol/), [apidog Devin 2026 rundown](https://apidog.com/blog/whats-new-in-devin-2026/)

### GitHub Copilot — Agent (Visual Studio) & CLI updates
- **What changed:** July 30, 2026 changelog: new SDK-based "Agent" mode in Copilot Chat for Visual Studio (public preview), with built-in .NET/Azure skills. Copilot CLI added conditional sandbox bypass, Ctrl+G freeform editing, default web OAuth login, and native MDM sandbox policy. Copilot code review now supports agent skills + MCP servers, GA for Pro/Pro+/Business/Enterprise.
- **How to use it now:**
  - Update Visual Studio and open Copilot Chat → select "Agent" from the agent picker.
  - Update Copilot CLI (`gh extension upgrade gh-copilot` or npm package per your install method) to pick up the new session controls.
  - Enable MCP-based code review under repo/org Copilot settings.
- **Source:** [GitHub Changelog: Copilot in Visual Studio — July update](https://github.blog/changelog/2026-07-30-github-copilot-in-visual-studio-july-update/)

## 🔧 Ongoing betas / previews

### Claude Fable 5 & Claude Mythos 5 / Mythos Preview (Anthropic — Project Glasswing)
- **Status:** Claude Fable 5 (Anthropic's most capable *widely released* model, `claude-fable-5`) has been GA since June 9, 2026 on the API, Bedrock, Vertex, and Microsoft Foundry. Claude Mythos 5 and the unreleased Claude Mythos Preview are restricted to Project Glasswing, an invitation-only defensive-cybersecurity program (~50 organizations including AWS, Apple, Cisco, CrowdStrike, Google, JPMorgan, Microsoft, NVIDIA; $100M in usage credits committed). No general release planned.
- **How to get access:** Fable 5 is self-serve like any Claude model. Mythos 5 / Mythos Preview access requires contacting your Anthropic, AWS, or Google Cloud account team — no public sign-up.
- **How to use it:** Fable 5 — model ID `claude-fable-5`, same Messages API, $10/MTok in / $50/MTok out, 1M context, always-on adaptive thinking.
- **Source:** [Anthropic: Project Glasswing](https://www.anthropic.com/glasswing), [Claude models overview](https://platform.claude.com/docs/en/about-claude/models/overview), [Simon Willison on Glasswing](https://simonwillison.net/2026/Apr/7/project-glasswing/)

### Claude Code — subagent controls in flux
- **Status:** Rapid iteration in late July 2026: v2.1.217 (July 21) capped concurrent subagents at 20 and disabled nested spawning; v2.1.219 (July 24) reinstated nesting at default depth 3.
- **How to get access:** Ships automatically with Claude Code updates — just keep the CLI current (`npm install -g @anthropic-ai/claude-code` then `claude update`, or your existing install method).
- **How to use it:** Set `CLAUDE_CODE_SUBAGENT_MODEL` to route all subagents to a specific model; set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` to disable nested spawning if you hit stability issues.
- **Source:** [digitalapplied.com on subagent guardrails](https://www.digitalapplied.com/blog/claude-code-subagent-depth-limits-budget-caps-2026), [Claude Code changelog](https://www.gradually.ai/en/changelogs/claude-code/)

### Inkling-Small (Thinking Machines Lab)
- **Status:** Preview alongside the flagship Inkling release (July 15-16, 2026) — 276B total/12B active params, matches or beats the full-size model on several benchmarks at lower cost.
- **How to get access:** Weights already on Hugging Face under the `thinkingmachines` org; treat as early/preview quality pending further eval.
- **How to use it:** Same distribution channel as Inkling — download directly or fine-tune via Tinker.
- **Source:** [Hugging Face: thinkingmachines/Inkling-Small](https://huggingface.co/thinkingmachines/Inkling-Small)

### Mistral open-weight MoE family ("fat but sparse")
- **Status:** CEO Arthur Mensch confirmed a new open-weight Mixture-of-Experts family entering early access in July 2026, aimed at closing the gap with frontier closed models.
- **How to get access:** Not yet broadly available — watch the [Mistral changelog](https://docs.mistral.ai/resources/changelogs) for early-access sign-up details.
- **How to use it:** Nothing to run yet; existing Mistral models (Mistral OCR 4, Leanstral 1.5, Robostral Navigate) remain available via `docs.mistral.ai` in the meantime.
- **Source:** [Tech Times: Mistral targets frontier gap](https://www.techtimes.com/articles/319798/20260706/mistral-ai-targets-frontier-gap-open-weight-model-entering-july-early-access.html)

### Amazon Quick (AWS)
- **Status:** Launched in preview April 28, 2026 at AWS's "What's Next" event — a consumer/work AI assistant competing with Microsoft 365 Copilot; free tier with no AWS account required, paid "Plus" tier available.
- **How to get access:** Sign up directly (social sign-in supported) — no AWS account needed. Desktop app plus Google Workspace and Microsoft Office connectors.
- **How to use it:** Install the Quick desktop app, connect your work apps, and use natural-language requests to generate documents/visual assets or trigger actions.
- **Source:** [AWS: Top announcements of What's Next with AWS 2026](https://aws.amazon.com/blogs/aws/top-announcements-of-the-whats-next-with-aws-2026/), [Constellation Research](https://www.constellationr.com/insights/news/aws-launches-amazon-quick-connect-family-business-apps-openai-managed-agents)

### OpenAI models / Codex / Managed Agents on Amazon Bedrock
- **Status:** Limited preview since April 28, 2026 — OpenAI's frontier models (including GPT-5.5 at launch, presumably extending to GPT-5.6 now) available through Bedrock alongside Anthropic and Meta models.
- **How to get access:** Request preview access through the AWS Bedrock console; note Bedrock Agents "Classic" stopped accepting new customers July 30, 2026 — new agent builds should use current AgentCore tooling instead.
- **Source:** [OpenAI: OpenAI on AWS](https://openai.com/index/openai-on-aws/), [The Register](https://www.theregister.com/2026/04/28/openai_climbs_into_amazons_bedrock/)

## 🔮 Announced / upcoming

### Gemini 4 (Google DeepMind)
- **What's expected:** Confirmed in pre-training as of July 21, 2026 — Google's own description is its "most ambitious pre-training run yet." Sundar Pichai told analysts it will be "significantly larger" than current Gemini models. No release date given; Gemini 3.5 Pro itself is still not shipped (delayed for an architectural rebuild, last reported target July 17, which appears to have slipped further since no Pro model shipped in the July 21 trio).
- **How to prepare / get early access:** Nothing to sign up for yet. Track [deepmind.google/models](https://deepmind.google/models/) and the Google AI blog for the eventual preview announcement.
- **Source:** [9to5Google](https://9to5google.com/2026/07/21/gemini-3-6-flash-launch/), [TechCrunch: Google releases three new Gemini models — but no 3.5 Pro](https://techcrunch.com/2026/07/21/google-releases-three-new-gemini-models-but-no-3-5-pro/)

### GPT-6 (OpenAI)
- **What's expected:** Not formally announced with a date. OpenAI's internal codename "Spud" finished pretraining March 24, 2026, but shipped as GPT-5.5 in April rather than GPT-6 — the "GPT-6" label has effectively been leapfrogged by the 5.x line (now at 5.6) for two straight cycles. Some reporting speculates a developer preview in late 2026 with public release in early 2027; Sam Altman has flagged long-term memory as the headline feature of whatever comes next. Treat all specific dates as speculation, not confirmed.
- **How to prepare / get early access:** Nothing to sign up for. Current best-available OpenAI tier is GPT-5.6 Sol via API/ChatGPT/Codex (see shipped section above).
- **Source:** [felloai: Still no GPT-6 (July 2026)](https://felloai.com/all-we-know-about-chatgpt-6/), [Geeky Gadgets: developer preview speculation](https://www.geeky-gadgets.com/openai-chatgpt-6-late-2026-preview/)

### Gemini 3.5 Flash Cyber general availability (Google DeepMind)
- **What's expected:** Currently a pilot restricted to governments and "trusted partners" for vulnerability discovery/remediation; no stated timeline for wider release, mirroring Anthropic's Glasswing-gated approach to offensive/defensive security models.
- **How to prepare / get early access:** Only reachable via direct partnership discussions with Google DeepMind — no public waitlist found.
- **Source:** [Google blog: Introducing Gemini 3.6 Flash, 3.5 Flash-Lite, 3.5 Flash Cyber](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/)

## Notes
- First edition of this report — nothing carried over or dropped yet.
- Model-naming caution: several vendors (Anthropic's "Fable/Mythos/Opus/Sonnet 5" line, OpenAI's "Sol/Terra/Luna" tiers) have moved to non-numeric or multi-tier naming that changes fast; always re-check the vendor's live model-ID docs page before hardcoding a model string in production code, since exact IDs shift between preview and GA.
- Anthropic and Google DeepMind are both now gating their most capable/most security-sensitive models behind invitation-only programs (Project Glasswing; Gemini 3.5 Flash Cyber pilot) rather than shipping them broadly — worth tracking as a pattern, not a one-off.
