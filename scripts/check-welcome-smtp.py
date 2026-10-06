#!/usr/bin/env python3
"""Smoke test Beget SMTP and IMAP on the VPS without printing credentials."""

import imaplib
import json
import smtplib
import ssl
import time
import uuid
from email.message import EmailMessage
from pathlib import Path


mailbox = "hello@pro-schools.ru"
env = Path("/var/www/school-portal/.env.local")
line = next((x for x in env.read_text().splitlines() if x.startswith("PROSCHOOLS_SMTP_PASSWORD=")), None)
if line is None:
    raise SystemExit("SMTP password is not configured")
password = json.loads(line.partition("=")[2])
token = "proschools-smoke-" + uuid.uuid4().hex

message = EmailMessage()
message["From"] = mailbox
message["To"] = mailbox
message["Subject"] = "Проверка почты pro-schools.ru " + token
message.set_content("Проверка отправки и получения служебного письма.")

with smtplib.SMTP_SSL("smtp.beget.com", 465, context=ssl.create_default_context(), timeout=20) as smtp:
    smtp.login(mailbox, password)
    smtp.send_message(message)
print("SMTP accepted test message", flush=True)

for _ in range(12):
    with imaplib.IMAP4_SSL("imap.beget.com", 993, ssl_context=ssl.create_default_context(), timeout=20) as imap:
        imap.login(mailbox, password)
        imap.select("INBOX")
        status, ids = imap.search(None, "SUBJECT", token)
        if status == "OK" and ids[0]:
            print("IMAP received test message")
            break
    time.sleep(5)
else:
    raise SystemExit("SMTP accepted message, but IMAP did not receive it within 60 seconds")
