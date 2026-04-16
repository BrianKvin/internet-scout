"""URL validation and SSRF protection.

Rejects URLs that target private/internal networks, localhost,
cloud metadata endpoints, and non-HTTP schemes.
"""

import ipaddress
import socket
from urllib.parse import urlparse

from fastapi import HTTPException


_BLOCKED_HOSTS = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "[::1]",
    "metadata.google.internal",
    "metadata.internal",
}

_ALLOWED_SCHEMES = {"http", "https"}


def _is_private_ip(hostname: str) -> bool:
    """Return True if hostname resolves to a private/reserved IP."""
    try:
        addr = ipaddress.ip_address(hostname)
        return addr.is_private or addr.is_reserved or addr.is_loopback
    except ValueError:
        pass

    try:
        resolved = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        for _, _, _, _, sockaddr in resolved:
            ip = sockaddr[0]
            addr = ipaddress.ip_address(ip)
            if addr.is_private or addr.is_reserved or addr.is_loopback:
                return True
    except (socket.gaierror, OSError):
        pass

    return False


def validate_scrape_url(url: str) -> str:
    """Validate a URL for scraping and return the cleaned URL.

    Raises HTTPException 400 if the URL is invalid, uses a blocked
    scheme, or targets a private/internal network.
    """
    if not url or not url.strip():
        raise HTTPException(400, "URL is required")

    parsed = urlparse(url.strip())

    if parsed.scheme not in _ALLOWED_SCHEMES:
        raise HTTPException(400, f"Unsupported URL scheme: {parsed.scheme or '(empty)'}")

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(400, "URL has no hostname")

    if hostname.lower() in _BLOCKED_HOSTS:
        raise HTTPException(400, "URL targets a blocked host")

    # Block AWS/GCP/Azure metadata endpoints
    if "169.254.169.254" in url or "metadata" in hostname.lower():
        raise HTTPException(400, "URL targets a blocked host")

    if _is_private_ip(hostname):
        raise HTTPException(400, "URL targets a private network")

    return url.strip()
