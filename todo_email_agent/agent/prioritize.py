import re
from dataclasses import dataclass
from datetime import datetime, timezone

URGENCY_KEYWORDS = (
    "urgent", "asap", "as soon as possible", "eod", "cob", "deadline",
    "action required", "action needed", "please respond", "please review",
    "please approve", "time sensitive", "overdue", "reminder",
)

QUESTION_OR_REQUEST = re.compile(r"[?]|please (advise|confirm|send|share|approve|review|respond)", re.I)

# Common bulk/automated senders we don't want cluttering the to-do list.
NOISE_SENDER_PATTERNS = (
    "noreply", "no-reply", "notifications@", "newsletter", "mailer-daemon",
)


@dataclass
class Score:
    value: int
    priority: str  # High / Medium / Low
    signals: list[str]


def _text_of(message: dict) -> str:
    subject = message.get("subject") or ""
    preview = message.get("bodyPreview") or ""
    return f"{subject}\n{preview}".lower()


def is_noise(message: dict) -> bool:
    sender = ((message.get("from") or {}).get("emailAddress") or {}).get("address", "").lower()
    return any(p in sender for p in NOISE_SENDER_PATTERNS)


def needs_action(message: dict) -> bool:
    """Heuristic: does this look like something the user needs to act on,
    as opposed to an FYI/notification/newsletter?"""
    if is_noise(message):
        return False
    text = _text_of(message)
    if any(k in text for k in URGENCY_KEYWORDS):
        return True
    if QUESTION_OR_REQUEST.search(text):
        return True
    if (message.get("flag") or {}).get("flagStatus") == "flagged":
        return True
    if message.get("importance") == "high":
        return True
    return False


def score_message(message: dict) -> Score:
    text = _text_of(message)
    signals: list[str] = []
    points = 0

    if message.get("importance") == "high":
        points += 3
        signals.append("marked high importance")

    if (message.get("flag") or {}).get("flagStatus") == "flagged":
        points += 3
        signals.append("flagged for follow-up")

    if not message.get("isRead", True):
        points += 1
        signals.append("unread")

    matched_keywords = [k for k in URGENCY_KEYWORDS if k in text]
    if matched_keywords:
        points += 2
        signals.append(f"urgency keyword: {matched_keywords[0]}")

    if QUESTION_OR_REQUEST.search(text):
        points += 1
        signals.append("reads as a question/request")

    received = message.get("receivedDateTime")
    if received:
        try:
            received_dt = datetime.fromisoformat(received.replace("Z", "+00:00"))
            age_days = (datetime.now(timezone.utc) - received_dt).days
            if age_days >= 3:
                points += 2
                signals.append(f"unanswered for {age_days}d")
            elif age_days >= 1:
                points += 1
        except ValueError:
            pass

    if points >= 5:
        priority = "High"
    elif points >= 2:
        priority = "Medium"
    else:
        priority = "Low"

    return Score(value=points, priority=priority, signals=signals)
