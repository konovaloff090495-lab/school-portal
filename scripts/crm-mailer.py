#!/usr/bin/env python3
"""Consent-based, bounded email sequence for pro-schools.ru.

The web app uses enroll/confirm/unsubscribe over stdin. Cron runs `run` daily.
No historical leads are imported. Database and logs stay on the VPS.
"""

import datetime as dt
import email.utils
import hashlib
import html
import json
import os
from pathlib import Path
import re
import secrets
import smtplib
import sqlite3
import ssl
import sys
import time
from email.message import EmailMessage
from urllib.parse import urlencode

sys.path.insert(0, str(Path(__file__).resolve().parent / 'privacy'))
from pii_fields import Fields

ROOT = Path(__file__).resolve().parents[1]
DEPLOYMENT_FILE = Path(__file__).resolve().parent / 'deployment.json'
DEPLOYMENT = json.loads(DEPLOYMENT_FILE.read_text()) if DEPLOYMENT_FILE.exists() else {}
DB = Path(os.environ.get('CRM_MAILER_DB', DEPLOYMENT.get('db', ROOT / '.crm-mailer.sqlite3')))
PAUSE = Path(os.environ.get('CRM_MAILER_PAUSE_PATH', DB.parent / '.crm-mailer-paused'))
FROM = 'hello@pro-schools.ru'
BASE = 'https://pro-schools.ru'
PARTNER = 'https://school-university.com'
MAX_PER_DAY = 20
MAX_PER_RUN = 10
MAX_WELCOME_MINUTE = 10
MAX_WELCOME_DAY = 100
STAGES = (7, 21, 35, 49)  # days after confirmation
UTC = dt.timezone.utc

# Programs verified against school-university.com on 06.10.2026.
# Each letter discusses one theme. Across four letters, all 21 products appear.
CAMPAIGNS = (
    ('Форматы школы: от семейного обучения до экстерната', 'formats', (
        ('/', 'Онлайн-школа 5–11 класс', 'Живые и записанные уроки, наставник, психолог и аттестация.'),
        ('/externat/', 'Экстернат', 'Ускоренная программа: два класса за один год, аттестация онлайн.'),
        ('/semeynaya-shkola/', 'Семейная школа', 'Обучение дома с прикреплением и аттестациями.'),
        ('/attestaciya/', 'Аттестация за класс', 'Для семей, которым нужна официальная аттестация.'),
        ('/zaochnaya-shkola/', 'Заочная школа', 'Официальное зачисление и гибкий график.'),
        ('/vechernyaya-shkola/', 'Вечерняя школа', 'Формат для взрослых и старшеклассников.'),
    )),
    ('Поддержка в учёбе и подготовка к экзаменам', 'exams', (
        ('/kursy-ege/', 'Курсы ЕГЭ', 'Подготовка по предметам и пробные экзамены.'),
        ('/kursy-oge/', 'Курсы ОГЭ', 'Подготовка для девятиклассников.'),
        ('/repetitor/', 'Репетиторы', 'Индивидуальные занятия по школьным предметам.'),
        ('/lektoriy/', 'Лекторий', 'Бесплатные занятия для школьников.'),
        ('/vneurochka/', 'Внеурочные занятия', 'Кружки и дополнительные направления для учеников.'),
    )),
    ('Курсы и направления для детей и подростков', 'children', (
        ('/nachalnaya-shkola/', '1–4 класс', 'Математика, русский, чтение и английский.'),
        ('/kursy-dlya-detey/', 'Курсы для детей', 'Направления от нейросетей до дизайна и финансов.'),
        ('/programmirovanie-dlya-detey/', 'Программирование', 'От Scratch и Roblox до Python.'),
        ('/soft-skills/', 'Гибкие навыки', 'Общение, уверенность и работа в команде.'),
        ('/profilnye-klassy/', 'Профильные классы', 'IT, дизайн и предпринимательство.'),
    )),
    ('Что делать после школы: колледж, вуз и другие варианты', 'admission', (
        ('/kolledzh/', 'Колледж «Синергия»', 'Программы после 9 и 11 класса.'),
        ('/vuz/', 'Университет «Синергия»', 'Очные и онлайн-программы высшего образования.'),
        ('/obuchenie-za-rubezhom/', 'Обучение за рубежом', 'Программы с зарубежными партнёрами.'),
        ('/soprovozhdenie-do-postupleniya/', 'Сопровождение до поступления', 'План поступления и помощь с документами.'),
        ('/materialy/abiturient/', 'Гид абитуриента', 'Бесплатный материал о сроках и документах.'),
    )),
)


def now():
    return dt.datetime.now(UTC)


_fields = None

def fields():
    global _fields
    if _fields is None:
        configured = os.environ.get('PII_FIELDS_KEY_PATH') or DEPLOYMENT.get('field_key')
        if not configured and os.environ.get('NODE_ENV') == 'production':
            raise RuntimeError('Operational data encryption key is not configured')
        key = Path(configured) if configured else ROOT / 'data-private' / 'pii-fields.key'
        if not key.exists() and not configured:
            Fields.create(key, 'gerasimov', 'proschools')
        _fields = Fields(key)
    return _fields

def private_row(cursor, values):
    row = sqlite3.Row(cursor, values)
    if 'email_cipher' not in row.keys():
        return row
    data = dict(row)
    if data['email_cipher']:
        data['email'] = fields().open(data['email_cipher'], 'subscriber.email')
    for key in ('first_name', 'consent_source'):
        if key in data:
            data[key] = fields().open(data[key], 'subscriber.' + key)
    return data


def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB, timeout=10)
    os.chmod(DB, 0o600)
    db.row_factory = private_row
    db.execute('PRAGMA secure_delete=ON')
    db.execute('PRAGMA busy_timeout=10000')
    db.execute('''CREATE TABLE IF NOT EXISTS subscribers (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      first_name TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending','active','unsubscribed','complete','failed')),
      consent_at TEXT NOT NULL,
      consent_source TEXT NOT NULL,
      confirmed_at TEXT,
      next_at TEXT,
      step INTEGER NOT NULL DEFAULT 0,
      last_sent_at TEXT,
      attempts INTEGER NOT NULL DEFAULT 0
    )''')
    if 'email_cipher' not in [row['name'] for row in db.execute('PRAGMA table_info(subscribers)')]:
        db.execute('ALTER TABLE subscribers ADD COLUMN email_cipher TEXT')
    fields()  # Fail before modifying data if the configured key is unavailable.
    db.execute('CREATE INDEX IF NOT EXISTS subscribers_due ON subscribers(status,next_at)')
    db.execute('CREATE TABLE IF NOT EXISTS welcome_sends (sent_at REAL NOT NULL, recipient_hash TEXT NOT NULL)')
    db.execute('CREATE INDEX IF NOT EXISTS welcome_sends_time ON welcome_sends(sent_at)')
    db.commit()
    return db


def reply(value):
    print(json.dumps(value, ensure_ascii=False))


def enroll(db, data):
    address = str(data.get('email', '')).strip().lower()
    if len(address) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', address):
        return {'status': 'invalid'}
    if data.get('consent') is not True:
        return {'status': 'no-consent'}
    name = str(data.get('name', '')).strip().split(' ')[0][:60] or 'Здравствуйте'
    source = str(data.get('source', 'site'))[:200]
    previous = db.execute('SELECT token,status FROM subscribers WHERE email IN (?,?)', (fields().index(address), address)).fetchone()
    if previous:
        # A new form submission cannot silently reverse an earlier opt-out.
        return {'status': previous['status'], 'token': previous['token'] if previous['status'] in ('pending', 'active') else None}
    token = secrets.token_urlsafe(32)
    db.execute('INSERT INTO subscribers(email,email_cipher,first_name,token,status,consent_at,consent_source) VALUES(?,?,?,?,?,?,?)',
               (fields().index(address), fields().seal(address, 'subscriber.email'), fields().seal(name, 'subscriber.first_name'), token, 'pending', now().isoformat(), fields().seal(source, 'subscriber.consent_source')))
    db.commit()
    return {'status': 'pending', 'token': token}


def confirm(db, token):
    row = db.execute('SELECT status FROM subscribers WHERE token=?', (token,)).fetchone()
    if not row or row['status'] not in ('pending', 'active'):
        return {'status': 'invalid'}
    if row['status'] == 'pending':
        current = now()
        db.execute('UPDATE subscribers SET status=?,confirmed_at=?,next_at=? WHERE token=?',
                   ('active', current.isoformat(), (current + dt.timedelta(days=STAGES[0])).isoformat(), token))
        db.commit()
    return {'status': 'active'}


def unsubscribe(db, token):
    db.execute("UPDATE subscribers SET status='unsubscribed',next_at=NULL WHERE token=?", (token,))
    db.commit()
    return {'status': 'unsubscribed'}


def reserve_welcome(db, data):
    address = str(data.get('email', '')).strip().lower()
    if len(address) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', address):
        return {'status': 'invalid'}
    current = time.time()
    original_digest = hashlib.sha256(address.encode()).hexdigest()
    digest = fields().index(original_digest, 'welcome')
    db.execute('BEGIN IMMEDIATE')
    db.execute('DELETE FROM welcome_sends WHERE sent_at<?', (current - 86400,))
    minute = db.execute('SELECT COUNT(*) FROM welcome_sends WHERE sent_at>?', (current - 60,)).fetchone()[0]
    day = db.execute('SELECT COUNT(*) FROM welcome_sends').fetchone()[0]
    same = db.execute('SELECT COUNT(*) FROM welcome_sends WHERE recipient_hash IN (?,?)', (digest, original_digest)).fetchone()[0]
    if minute >= MAX_WELCOME_MINUTE or day >= MAX_WELCOME_DAY or same >= 3:
        db.commit()
        return {'status': 'limited'}
    db.execute('INSERT INTO welcome_sends(sent_at,recipient_hash) VALUES(?,?)', (current, digest))
    db.commit()
    return {'status': 'allowed'}


def partner_link(path, theme):
    query = urlencode({'utm_source': 'gerasimov_lav', 'utm_medium': 'email',
                       'utm_campaign': 'proschools_nurture', 'utm_content': theme})
    return f'{PARTNER}{path}?{query}'


def make_message(row):
    title, theme, products = CAMPAIGNS[row['step']]
    unsubscribe_url = f"{BASE}/api/mail/unsubscribe/?token={row['token']}"
    intro = f"{row['first_name']}, вы оставили заявку на pro-schools.ru и подтвердили подписку на письма о программах обучения. Ниже — варианты по одной теме, чтобы было проще выбрать."
    links = '\n\n'.join(f'{name} — {description}\n{partner_link(path, theme)}' for path, name, description in products)
    plain = f"{intro}\n\n{links}\n\nЭто партнёрские предложения онлайн-школы «Синергия». Условия уточняйте на странице программы.\n\nОтписаться: {unsubscribe_url}\nВопросы: {FROM}"
    cards = ''.join(f'<div style="padding:14px 0;border-bottom:1px solid #e2e8f0"><b>{html.escape(name)}</b><p style="margin:7px 0;color:#475569">{html.escape(description)}</p><a href="{html.escape(partner_link(path,theme),quote=True)}">Посмотреть программу →</a></div>' for path, name, description in products)
    page = f'<!doctype html><html lang="ru"><meta charset="utf-8"><body style="background:#f1f5f9;padding:20px;font:15px Arial,sans-serif;color:#0f172a"><div style="max-width:610px;margin:auto;padding:24px;background:white;border-radius:12px"><b style="color:#0369a1">pro-schools.ru</b><h1 style="font-size:22px">{html.escape(title)}</h1><p style="line-height:1.5">{html.escape(intro)}</p>{cards}<p style="font-size:12px;color:#64748b">Это партнёрские предложения онлайн-школы «Синергия». Условия уточняйте на странице программы.</p><p style="font-size:12px"><a href="{html.escape(unsubscribe_url,quote=True)}">Отписаться от рассылки</a> · {FROM}</p></div></body></html>'
    msg = EmailMessage()
    msg['From'] = f'Школы России <{FROM}>'
    msg['To'] = row['email']
    msg['Subject'] = title
    msg['Date'] = email.utils.format_datetime(now())
    msg['List-Unsubscribe'] = f'<{unsubscribe_url}>'
    msg['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    msg.set_content(plain)
    msg.add_alternative(page, subtype='html')
    return msg


def smtp_password():
    configured = os.environ.get('PROSCHOOLS_SMTP_PASSWORD')
    if configured:
        return configured
    for line in (ROOT / '.env.local').read_text().splitlines():
        if line.startswith('PROSCHOOLS_SMTP_PASSWORD='):
            return json.loads(line.partition('=')[2])
    raise RuntimeError('SMTP password not configured')


def run(db):
    if PAUSE.exists():
        print('paused')
        return
    cutoff = now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    sent_today = db.execute('SELECT COUNT(*) FROM subscribers WHERE last_sent_at>=?', (cutoff,)).fetchone()[0]
    limit = min(MAX_PER_RUN, MAX_PER_DAY - sent_today)
    if limit <= 0:
        print('daily cap reached')
        return
    # Unconfirmed addresses are not kept indefinitely.
    expired = (now() - dt.timedelta(days=30)).isoformat()
    db.execute("DELETE FROM subscribers WHERE status='pending' AND consent_at<?", (expired,))
    db.commit()
    due = db.execute("SELECT * FROM subscribers WHERE status='active' AND next_at<=? AND step<? ORDER BY next_at LIMIT ?", (now().isoformat(), len(CAMPAIGNS), limit)).fetchall()
    if not due:
        print('checked=0 sent=0')
        return
    password = smtp_password()
    sent = 0
    with smtplib.SMTP_SSL('smtp.beget.com', 465, context=ssl.create_default_context(), timeout=20) as smtp:
        smtp.login(FROM, password)
        for row in due:
            # Recheck suppression just before every send.
            fresh = db.execute('SELECT status,step FROM subscribers WHERE email IN (?,?)', (fields().index(row['email']), row['email'])).fetchone()
            if not fresh or fresh['status'] != 'active' or fresh['step'] != row['step']:
                continue
            try:
                smtp.send_message(make_message(row))
            except smtplib.SMTPRecipientsRefused:
                db.execute("UPDATE subscribers SET status='failed',next_at=NULL WHERE email IN (?,?)", (fields().index(row['email']), row['email']))
                db.commit()
                continue
            except (smtplib.SMTPException, OSError):
                attempts = row['attempts'] + 1
                db.execute('UPDATE subscribers SET attempts=?,next_at=?,status=? WHERE email IN (?,?)',
                           (attempts, (now() + dt.timedelta(days=1)).isoformat(), 'failed' if attempts >= 3 else 'active', fields().index(row['email']), row['email']))
                db.commit()
                PAUSE.touch(mode=0o600)
                print('SMTP error: campaign paused for review')
                break
            step = row['step'] + 1
            status = 'complete' if step == len(CAMPAIGNS) else 'active'
            next_at = None if status == 'complete' else (dt.datetime.fromisoformat(row['confirmed_at']) + dt.timedelta(days=STAGES[step])).isoformat()
            db.execute('UPDATE subscribers SET step=?,status=?,next_at=?,last_sent_at=?,attempts=0 WHERE email IN (?,?)',
                       (step, status, next_at, now().isoformat(), fields().index(row['email']), row['email']))
            db.commit()
            sent += 1
            time.sleep(3)
    print(f'checked={len(due)} sent={sent}')


def encrypt_state(db):
    # This explicit migration preserves all tokens, statuses, consent and schedules.
    db.row_factory = sqlite3.Row
    rows = db.execute('SELECT * FROM subscribers').fetchall()
    db.execute('BEGIN IMMEDIATE')
    for row in rows:
        address = (fields().open(row['email_cipher'], 'subscriber.email') if row['email_cipher'] else row['email']).strip().lower()
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', address):
            raise RuntimeError('Cannot safely migrate subscriber identity')
        db.execute('UPDATE subscribers SET email=?,email_cipher=?,first_name=?,consent_source=? WHERE email=?',
                   (fields().index(address), fields().seal(address, 'subscriber.email'),
                    fields().seal(fields().open(row['first_name'], 'subscriber.first_name'), 'subscriber.first_name'),
                    fields().seal(fields().open(row['consent_source'], 'subscriber.consent_source'), 'subscriber.consent_source'), row['email']))
    db.execute("UPDATE welcome_sends SET recipient_hash=pii_index(recipient_hash) WHERE recipient_hash NOT LIKE 'h1:%'")
    db.commit()
    if db.execute('PRAGMA wal_checkpoint(TRUNCATE)').fetchone()[0] != 0:
        raise RuntimeError('Busy database; retry checkpoint before considering migration complete')
    db.execute('VACUUM')
    db.execute('PRAGMA wal_checkpoint(TRUNCATE)')
    db.row_factory = private_row
    return {'status': 'encrypted', 'subscribers_preserved': len(rows), 'tokens_and_delivery_state_preserved': True}


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('enroll', 'confirm', 'unsubscribe', 'reserve-welcome', 'run', 'status', 'encrypt-state'):
        raise SystemExit('usage: crm-mailer.py enroll|confirm|unsubscribe|reserve-welcome|run|status')
    with connect() as db:
        db.create_function('pii_index', 1, lambda value: fields().index(value, 'welcome'))
        action = sys.argv[1]
        if action in ('enroll', 'confirm', 'unsubscribe', 'reserve-welcome'):
            data = json.load(sys.stdin)
            if action == 'enroll': result = enroll(db, data)
            elif action == 'reserve-welcome': result = reserve_welcome(db, data)
            elif action == 'confirm': result = confirm(db, str(data.get('token', '')))
            else: result = unsubscribe(db, str(data.get('token', '')))
            reply(result)
        elif action == 'encrypt-state':
            reply(encrypt_state(db))
        elif action == 'run':
            run(db)
        else:
            reply(dict(db.execute('SELECT status,COUNT(*) FROM subscribers GROUP BY status').fetchall()))


if __name__ == '__main__':
    main()
