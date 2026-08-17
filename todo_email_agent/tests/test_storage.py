import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent.storage import TaskStore


def _store():
    tmp = Path(tempfile.mkdtemp()) / "tasks.json"
    return TaskStore(path=tmp)


def test_upsert_and_list():
    store = _store()
    store.upsert({"id": "a", "subject": "Task A", "score": 5, "priority": "High"})
    store.upsert({"id": "b", "subject": "Task B", "score": 2, "priority": "Low"})
    tasks = store.list()
    assert [t["id"] for t in tasks] == ["a", "b"]  # sorted by score desc


def test_rescan_preserves_done_status():
    store = _store()
    store.upsert({"id": "a", "subject": "Task A", "score": 5})
    store.mark_done("a")
    store.upsert({"id": "a", "subject": "Task A (updated)", "score": 7})
    assert store.get("a")["status"] == "done"
    assert store.list(status="open") == []


def test_mark_done_unknown_id_returns_false():
    store = _store()
    assert store.mark_done("missing") is False
