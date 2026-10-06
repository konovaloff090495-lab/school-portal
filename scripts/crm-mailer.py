#!/usr/bin/env python3
"""Consent-based, bounded email sequence for pro-schools.ru.

The web app uses enroll/confirm/unsubscribe over stdin. Cron runs `run` daily.
No historical leads are imported. Database and logs stay on the VPS.
"""

import datetime as dt
import email.utils
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

ROOT = Path(__file__).resolve().parents[1]
DB = Path(os.environ.get('CRM_MAILER_DB', ROOT / '.crm-mailer.sqlite3'))
PAUSE = ROOT / '.crm-mailer-paused'
FROM = 'hello@pro-schools.ru'
BASE = 'https://pro-schools.ru'
PARTNER = 'https://school-university.com'
MAX_PER_DAY = 20
MAX_PER_RUN = 10
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


def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB, timeout=10)
    os.chmod(DB, 0o600)
    db.row_factory = sqlite3.Row
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
    db.execute('CREATE INDEX IF NOT EXISTS subscribers_due ON subscribers(status,next_at)')
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
    previous = db.execute('SELECT token,status FROM subscribers WHERE email=?', (address,)).fetchone()
    if previous:
        # A new form submission cannot silently reverse an earlier opt-out.
        return {'status': previous['status'], 'token': previous['token'] if previous['status'] in ('pending', 'active') else None}
    token = secrets.token_urlsafe(32)
    db.execute('INSERT INTO subscribers(email,first_name,token,status,consent_at,consent_source) VALUES(?,?,?,?,?,?)',
               (address, name, token, 'pending', now().isoformat(), source))
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
            fresh = db.execute('SELECT status,step FROM subscribers WHERE email=?', (row['email'],)).fetchone()
            if not fresh or fresh['status'] != 'active' or fresh['step'] != row['step']:
                continue
            try:
                smtp.send_message(make_message(row))
            except smtplib.SMTPRecipientsRefused:
                db.execute("UPDATE subscribers SET status='failed',next_at=NULL WHERE email=?", (row['email'],))
                db.commit()
                continue
            except (smtplib.SMTPException, OSError):
                attempts = row['attempts'] + 1
                db.execute('UPDATE subscribers SET attempts=?,next_at=?,status=? WHERE email=?',
                           (attempts, (now() + dt.timedelta(days=1)).isoformat(), 'failed' if attempts >= 3 else 'active', row['email']))
                db.commit()
                PAUSE.touch(mode=0o600)
                print('SMTP error: campaign paused for review')
                break
            step = row['step'] + 1
            status = 'complete' if step == len(CAMPAIGNS) else 'active'
            next_at = None if status == 'complete' else (dt.datetime.fromisoformat(row['confirmed_at']) + dt.timedelta(days=STAGES[step])).isoformat()
            db.execute('UPDATE subscribers SET step=?,status=?,next_at=?,last_sent_at=?,attempts=0 WHERE email=?',
                       (step, status, next_at, now().isoformat(), row['email']))
            db.commit()
            sent += 1
            time.sleep(3)
    print(f'checked={len(due)} sent={sent}')


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('enroll', 'confirm', 'unsubscribe', 'run', 'status'):
        raise SystemExit('usage: crm-mailer.py enroll|confirm|unsubscribe|run|status')
    with connect() as db:
        action = sys.argv[1]
        if action in ('enroll', 'confirm', 'unsubscribe'):
            data = json.load(sys.stdin)
            reply({'enroll': enroll, 'confirm': confirm, 'unsubscribe': unsubscribe}[action](db, data if action == 'enroll' else str(data.get('token', ''))))
        elif action == 'run':
            run(db)
        else:
            reply(dict(db.execute('SELECT status,COUNT(*) FROM subscribers GROUP BY status').fetchall()))


if __name__ == '__main__':
    main()
