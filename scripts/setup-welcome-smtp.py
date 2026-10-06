#!/usr/bin/env python3
"""Securely install the Beget mailbox password on the pro-schools VPS.

Run in an interactive terminal after creating hello@pro-schools.ru in Beget.
The password is read without echo, sent only over SSH stdin, and never printed.
"""

import base64
import getpass
import subprocess


REMOTE = r'''
import json, os, pathlib, sys, tempfile
password = sys.stdin.read().rstrip("\n")
if not password:
    raise SystemExit("Empty password")
path = pathlib.Path("/var/www/school-portal/.env.local")
lines = path.read_text().splitlines() if path.exists() else []
lines = [line for line in lines if not line.startswith("PROSCHOOLS_SMTP_PASSWORD=")]
lines.append("PROSCHOOLS_SMTP_PASSWORD=" + json.dumps(password, ensure_ascii=False))
fd, tmp = tempfile.mkstemp(prefix=".env.local.", dir=str(path.parent))
try:
    with os.fdopen(fd, "w") as out:
        out.write("\n".join(lines) + "\n")
    os.chmod(tmp, 0o600)
    os.replace(tmp, path)
finally:
    if os.path.exists(tmp):
        os.unlink(tmp)
print("SMTP password installed")
'''


def main():
    first = getpass.getpass("Пароль hello@pro-schools.ru: ")
    second = getpass.getpass("Повторите пароль: ")
    if not first or first != second:
        raise SystemExit("Пароли не совпали")
    remote_code = base64.b64encode(REMOTE.encode()).decode()
    command = (
        "python3 -c 'import base64; exec(base64.b64decode(\""
        + remote_code
        + "\"))'"
    )
    result = subprocess.run(
        ["ssh", "-i", str(__import__("pathlib").Path.home() / ".ssh/id_ed25519"),
         "-o", "ConnectTimeout=15", "root@45.80.70.209", command],
        input=first + "\n", text=True, check=False,
    )
    if result.returncode:
        raise SystemExit("Не удалось сохранить пароль по SSH")


if __name__ == "__main__":
    main()
