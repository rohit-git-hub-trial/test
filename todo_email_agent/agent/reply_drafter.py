from . import config

TEMPLATE = (
    "Thanks for your note — acknowledging I've seen this and will follow up "
    "with a full response shortly."
)


def _draft_with_anthropic(subject: str, sender: str, body_preview: str, tone: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    prompt = (
        f"Draft a {tone} email reply body (no subject line, no greeting/signature "
        f"boilerplate beyond a short greeting and sign-off) to the message below. "
        f"Keep it to a few sentences.\n\n"
        f"From: {sender}\nSubject: {subject}\nMessage: {body_preview}"
    )
    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()


def draft_reply_body(message: dict, tone: str = "brief") -> str:
    subject = message.get("subject") or "(no subject)"
    sender = ((message.get("from") or {}).get("emailAddress") or {}).get("address", "")
    body_preview = message.get("bodyPreview") or ""

    if config.ANTHROPIC_API_KEY:
        try:
            return _draft_with_anthropic(subject, sender, body_preview, tone)
        except Exception as exc:  # fall back rather than block the draft
            print(f"Anthropic drafting failed ({exc}); using template instead.")

    return TEMPLATE
