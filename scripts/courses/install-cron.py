#!/usr/bin/env python3
"""Install the tested daily refresh at 10:00 Moscow (the VPS uses UTC)."""
from pathlib import Path
import subprocess
zone=subprocess.check_output(['date','+%Z'],text=True).strip()
if zone!='UTC':raise SystemExit('Check cron timezone before installation: '+zone)
cron=Path('/etc/cron.d/proschools-courses')
cron.write_text('# ProSchools course prices and offers: daily 10:00 Europe/Moscow (07:00 UTC).\n0 7 * * * root /bin/bash /var/www/school-portal/courses-runtime/scripts/courses/run-refresh.sh >> /var/www/school-portal/courses-runtime/work/courses/refresh.log 2>&1\n')
cron.chmod(0o644)
logrotate=Path('/etc/logrotate.d/proschools-courses')
logrotate.write_text('/var/www/school-portal/courses-runtime/work/courses/refresh.log {\n weekly\n rotate 4\n compress\n missingok\n notifempty\n copytruncate\n}\n')
print(cron.read_text())
print('cron active:',subprocess.check_output(['systemctl','is-active','cron'],text=True).strip())
