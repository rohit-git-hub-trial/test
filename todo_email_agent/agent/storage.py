import json
from typing import Any, Optional

from . import config


class TaskStore:
    def __init__(self, path=None) -> None:
        self.path = path or config.TASKS_PATH
        if not self.path.exists():
            self.path.write_text("{}")

    def _load(self) -> dict[str, Any]:
        return json.loads(self.path.read_text() or "{}")

    def _save(self, tasks: dict[str, Any]) -> None:
        self.path.write_text(json.dumps(tasks, indent=2, default=str))

    def upsert(self, task: dict[str, Any]) -> None:
        tasks = self._load()
        task_id = task["id"]
        existing = tasks.get(task_id, {})
        # Preserve local status (e.g. "done") across re-scans.
        task["status"] = existing.get("status", "open")
        tasks[task_id] = task
        self._save(tasks)

    def get(self, task_id: str) -> Optional[dict[str, Any]]:
        return self._load().get(task_id)

    def list(self, status: Optional[str] = "open") -> list[dict[str, Any]]:
        tasks = list(self._load().values())
        if status:
            tasks = [t for t in tasks if t.get("status") == status]
        return sorted(tasks, key=lambda t: t.get("score", 0), reverse=True)

    def mark_done(self, task_id: str) -> bool:
        tasks = self._load()
        if task_id not in tasks:
            return False
        tasks[task_id]["status"] = "done"
        self._save(tasks)
        return True
