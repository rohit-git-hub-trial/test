from typing import Any, Optional

import requests

from . import config
from .auth import get_access_token

MESSAGE_FIELDS = (
    "id,conversationId,subject,bodyPreview,body,from,receivedDateTime,"
    "isRead,importance,flag,webLink"
)


class GraphClient:
    def __init__(self) -> None:
        self._token: Optional[str] = None

    def _headers(self) -> dict:
        if self._token is None:
            self._token = get_access_token()
        return {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, **kwargs) -> requests.Response:
        url = path if path.startswith("http") else f"{config.GRAPH_BASE_URL}{path}"
        resp = requests.request(method, url, headers=self._headers(), timeout=30, **kwargs)
        if resp.status_code == 401:
            # Token likely expired mid-session; refresh once and retry.
            self._token = get_access_token()
            resp = requests.request(method, url, headers=self._headers(), timeout=30, **kwargs)
        resp.raise_for_status()
        return resp

    def list_messages(self, folder: str = "inbox", top: int = 50) -> list[dict[str, Any]]:
        params = {
            "$top": str(top),
            "$select": MESSAGE_FIELDS,
            "$orderby": "receivedDateTime desc",
        }
        resp = self._request("GET", f"/me/mailFolders/{folder}/messages", params=params)
        return resp.json().get("value", [])

    def get_message(self, message_id: str) -> dict[str, Any]:
        params = {"$select": MESSAGE_FIELDS}
        return self._request("GET", f"/me/messages/{message_id}", params=params).json()

    def create_reply_draft(self, message_id: str, comment: str) -> dict[str, Any]:
        """Creates a draft reply (not sent) with `comment` prefixed above the
        quoted thread. Lands in the real Drafts folder, which syncs to every
        signed-in device including the phone Outlook app."""
        body = {"comment": comment} if comment else {}
        resp = self._request("POST", f"/me/messages/{message_id}/createReply", json=body)
        # Graph returns 202 with no body when `comment` is omitted, and 201
        # with the created draft when a comment is provided.
        return resp.json() if resp.content else {}
