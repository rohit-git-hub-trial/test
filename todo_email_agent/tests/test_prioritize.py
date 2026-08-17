import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent import prioritize

FOUR_DAYS_AGO = (datetime.now(timezone.utc) - timedelta(days=4)).strftime("%Y-%m-%dT%H:%M:%SZ")


def _message(**overrides):
    base = {
        "id": "msg-1",
        "subject": "Quarterly report",
        "bodyPreview": "Hi, just checking in on progress.",
        "from": {"emailAddress": {"address": "colleague@example.com"}},
        "receivedDateTime": FOUR_DAYS_AGO,
        "isRead": True,
        "importance": "normal",
        "flag": {"flagStatus": "notFlagged"},
    }
    base.update(overrides)
    return base


def test_urgent_keyword_is_actionable_and_high_scoring():
    msg = _message(subject="URGENT: need this ASAP", bodyPreview="Please respond today.")
    assert prioritize.needs_action(msg)
    score = prioritize.score_message(msg)
    assert score.value >= 5
    assert score.priority == "High"


def test_flagged_message_is_actionable():
    msg = _message(flag={"flagStatus": "flagged"})
    assert prioritize.needs_action(msg)


def test_plain_fyi_is_not_actionable():
    msg = _message(
        subject="FYI: office closed Friday",
        bodyPreview="Sharing that the office will be closed this Friday for the holiday.",
    )
    assert not prioritize.needs_action(msg)


def test_noreply_sender_is_noise():
    msg = _message(**{"from": {"emailAddress": {"address": "noreply@service.com"}}})
    assert prioritize.is_noise(msg)
    assert not prioritize.needs_action(msg)


def test_question_in_body_is_actionable():
    msg = _message(subject="Meeting", bodyPreview="Can you send the updated deck?")
    assert prioritize.needs_action(msg)
