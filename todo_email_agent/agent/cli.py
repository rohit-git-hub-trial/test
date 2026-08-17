import click
from rich.console import Console
from rich.table import Table

from . import auth, prioritize
from .graph_client import GraphClient
from .reply_drafter import draft_reply_body
from .storage import TaskStore

console = Console()


@click.group()
def cli() -> None:
    """Outlook to-do agent: scan your mailbox, prioritize, draft replies."""


@cli.command(name="auth")
def auth_() -> None:
    """One-time device-code sign-in to your Outlook account."""
    auth.sign_in_device_code()


@cli.command()
@click.option("--folder", default="inbox", help="Mail folder to scan.")
@click.option("--top", default=50, help="Max messages to fetch.")
def scan(folder: str, top: int) -> None:
    """Fetch recent messages, score them, and update the local to-do list."""
    client = GraphClient()
    store = TaskStore()
    messages = client.list_messages(folder=folder, top=top)

    added = 0
    for message in messages:
        if not prioritize.needs_action(message):
            continue
        score = prioritize.score_message(message)
        sender = ((message.get("from") or {}).get("emailAddress") or {}).get("address", "")
        store.upsert(
            {
                "id": message["id"],
                "subject": message.get("subject") or "(no subject)",
                "sender": sender,
                "received": message.get("receivedDateTime"),
                "score": score.value,
                "priority": score.priority,
                "signals": score.signals,
                "webLink": message.get("webLink"),
            }
        )
        added += 1

    console.print(f"Scanned {len(messages)} messages in '{folder}', tracked {added} as actionable.")


@cli.command(name="list")
@click.option("--priority", default=None, help="Filter: High, Medium, or Low.")
@click.option("--status", default="open", help="Filter by status (open/done). Use 'all' for both.")
def list_tasks(priority: str, status: str) -> None:
    """Show the prioritized to-do list."""
    store = TaskStore()
    tasks = store.list(status=None if status == "all" else status)
    if priority:
        tasks = [t for t in tasks if t.get("priority", "").lower() == priority.lower()]

    table = Table(title="To-Do List")
    table.add_column("ID", overflow="fold", max_width=12)
    table.add_column("Priority")
    table.add_column("Subject", overflow="fold")
    table.add_column("From")
    table.add_column("Status")

    for t in tasks:
        table.add_row(
            t["id"][:10] + "…",
            t.get("priority", "?"),
            t.get("subject", ""),
            t.get("sender", ""),
            t.get("status", "open"),
        )
    console.print(table)
    console.print("(Use the full task id, printed by 'list --status all', with draft/done commands.)")


@cli.command()
@click.argument("task_id")
@click.option("--tone", default="brief", help="Tone hint for drafting, e.g. brief, formal.")
def draft(task_id: str, tone: str) -> None:
    """Create a real Outlook draft reply for a task. Syncs to your phone automatically."""
    store = TaskStore()
    task = _resolve_task(store, task_id)
    if not task:
        raise SystemExit(f"No task found matching id '{task_id}'.")

    client = GraphClient()
    message = client.get_message(task["id"])
    body = draft_reply_body(message, tone=tone)
    client.create_reply_draft(task["id"], body)
    console.print(
        f"Draft reply created for '{task['subject']}'. Check Drafts in Outlook "
        f"(desktop, web, or your phone app) to review and send."
    )


@cli.command()
@click.argument("task_id")
def done(task_id: str) -> None:
    """Mark a task complete."""
    store = TaskStore()
    task = _resolve_task(store, task_id)
    if not task or not store.mark_done(task["id"]):
        raise SystemExit(f"No task found matching id '{task_id}'.")
    console.print(f"Marked '{task['subject']}' done.")


def _resolve_task(store: TaskStore, task_id: str) -> dict | None:
    """Allow matching by full id or the truncated id shown in `list`."""
    exact = store.get(task_id)
    if exact:
        return exact
    for task in store.list(status=None):
        if task["id"].startswith(task_id):
            return task
    return None


if __name__ == "__main__":
    cli()
