"""Refresh the local Chinese font subset after changing static interface text.

Run with Python 3. This optional maintenance task uses only
the standard library and reads source files, never environment files or wallets.
"""

from pathlib import Path
import re
import urllib.parse
import urllib.request


def main():
    root = Path(__file__).resolve().parent.parent
    characters = {chr(value) for value in range(32, 127)}
    for source in (root / "src").rglob("*"):
        if source.suffix in {".js", ".jsx"}:
            characters.update(character for character in source.read_text() if ord(character) > 127)
    parameters = urllib.parse.urlencode({
        "family": "Noto Sans SC:wght@400;500;600;700",
        "display": "swap",
        "text": "".join(sorted(characters)),
    })
    request = urllib.request.Request(
        "https://fonts.googleapis.com/css2?" + parameters,
        headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        stylesheet = response.read().decode()
    font_url = re.search(r"url\((https[^)]+)\)", stylesheet).group(1)
    with urllib.request.urlopen(font_url, timeout=30) as response:
        content = response.read()
    (root / "public/fonts/noto-sans-sc-0.woff2").write_bytes(content)
    print(f"Updated {len(characters)} characters; {len(content)} bytes.")


if __name__ == "__main__":
    main()
