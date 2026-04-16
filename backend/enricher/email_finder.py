"""Email pattern guesser.

Generates common corporate email patterns from a name + domain.
"""


def guess_patterns(first: str, last: str, domain: str) -> list[str]:
    """Return common email format guesses for a person at a company.

    Args:
        first: First name
        last:  Last name
        domain: Company domain, e.g. "example.com"

    Returns:
        List of candidate email addresses in order of likelihood.
    """
    f = first.lower().strip()
    l = last.lower().strip()
    d = domain.lower().strip().lstrip("@")

    return [
        f"{f}@{d}",                    # john@example.com
        f"{f}.{l}@{d}",               # john.doe@example.com
        f"{f[0]}.{l}@{d}",            # j.doe@example.com
        f"{f[0]}{l}@{d}",             # jdoe@example.com
        f"{f}{l[0]}@{d}",             # johnd@example.com
        f"{f}_{l}@{d}",               # john_doe@example.com
        f"hi@{d}",                    # hi@example.com  (catch-all)
        f"hello@{d}",                 # hello@example.com
    ]
