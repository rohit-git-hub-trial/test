import msal

from . import config


def _load_cache() -> msal.SerializableTokenCache:
    cache = msal.SerializableTokenCache()
    if config.TOKEN_CACHE_PATH.exists():
        cache.deserialize(config.TOKEN_CACHE_PATH.read_text())
    return cache


def _save_cache(cache: msal.SerializableTokenCache) -> None:
    if cache.has_state_changed:
        config.TOKEN_CACHE_PATH.write_text(cache.serialize())


def _app(cache: msal.SerializableTokenCache) -> msal.PublicClientApplication:
    return msal.PublicClientApplication(
        config.require_client_id(),
        authority=config.GRAPH_AUTHORITY,
        token_cache=cache,
    )


def sign_in_device_code() -> None:
    """Interactive one-time sign-in. Prints a URL + code for the user to enter."""
    cache = _load_cache()
    app = _app(cache)
    flow = app.initiate_device_flow(scopes=config.GRAPH_SCOPES)
    if "user_code" not in flow:
        raise SystemExit(f"Failed to start device flow: {flow}")
    print(flow["message"])
    result = app.acquire_token_by_device_flow(flow)
    if "access_token" not in result:
        raise SystemExit(f"Sign-in failed: {result.get('error_description', result)}")
    _save_cache(cache)
    print("Signed in and token cached.")


def get_access_token() -> str:
    """Returns a valid access token, refreshing silently if possible."""
    cache = _load_cache()
    app = _app(cache)
    accounts = app.get_accounts()
    if accounts:
        result = app.acquire_token_silent(config.GRAPH_SCOPES, account=accounts[0])
        if result and "access_token" in result:
            _save_cache(cache)
            return result["access_token"]
    raise SystemExit("Not signed in (or token expired). Run: python -m agent auth")
