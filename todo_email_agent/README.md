# Todo Email Agent (Outlook)

A CLI agent that scans your Outlook mailbox, turns actionable emails into a
prioritized to-do list, and can draft replies. Drafts are written directly
into your real Outlook **Drafts** folder via Microsoft Graph, so they show
up on your phone's Outlook app automatically (same mailbox, same folder,
Microsoft's own sync) — no extra sync mechanism to build. You review/edit/send
from any device.

## How it works

1. `auth` — one-time device-code sign-in (via MSAL). No password is ever
   stored; only a refresh token cache on disk (`token_cache.json`, gitignored).
2. `scan` — pulls recent messages from a folder (default Inbox), scores each
   one for actionability/urgency, and upserts matching ones into a local
   task list (`data/tasks.json`).
3. `list` — shows the prioritized to-do list (High / Medium / Low).
4. `draft <task_id>` — generates a reply body (template-based, or via the
   Anthropic API if `ANTHROPIC_API_KEY` is set for a smarter draft) and
   creates it as a real draft on the original email thread. Open it on your
   phone, tweak it, hit send.
5. `done <task_id>` — marks a task complete locally.

## Setup

1. Register an app in Azure AD (Entra ID) → App registrations → New
   registration. Choose "Accounts in this organizational directory" (or
   multi-tenant, per your org's policy). Under **Authentication**, enable
   "Allow public client flows" (required for device code). Under **API
   permissions**, add delegated Microsoft Graph scopes:
   `Mail.Read`, `Mail.ReadWrite`, `offline_access`, `User.Read`.
   (`Mail.ReadWrite` covers draft creation; `Mail.Send` is intentionally
   *not* requested — the agent only ever creates drafts, never sends, so
   the send scope isn't needed.) Grant admin consent if your tenant
   requires it.

2. Copy `.env.example` to `.env` and fill in:
   - `AZURE_CLIENT_ID` — the app registration's Application (client) ID.
   - `AZURE_TENANT_ID` — your tenant ID (or `common` for multi-tenant/personal).
   - `ANTHROPIC_API_KEY` — optional, enables context-aware reply drafting.

3. Install dependencies and sign in:

   ```bash
   pip install -r requirements.txt
   python -m agent auth
   ```

4. Use it:

   ```bash
   python -m agent scan
   python -m agent list
   python -m agent draft <task_id>
   python -m agent done <task_id>
   ```

## Running it on a schedule

This ships as a CLI by design — credentials and the token cache stay local,
and nothing runs unattended unless you choose to. If you want it automatic,
add your own cron/systemd timer, e.g.:

```cron
*/30 * * * * cd /path/to/todo_email_agent && python -m agent scan
```

## Notes on prioritization

Each scanned message gets a score from signals Graph already exposes plus
lightweight text heuristics: Outlook "Importance: High", flagged-for-follow-up,
unread state, urgency keywords ("urgent", "asap", "eod", "deadline", "by
Friday"...), whether the message reads as a question/request, and how long
it's sat unanswered. No email content leaves your machine unless you opt in
to Anthropic-assisted drafting, and even then only the single message being
drafted is sent, not your mailbox.
