"""Source polling stays at 48h; date selections roll forward from the existing snapshot."""
import pathlib,subprocess
pathlib.Path('/etc/systemd/system/portfolio-afisha-views.service').write_text('''[Unit]
Description=Recalculate ProSchools date selections without source polling
After=portfolio-afisha-html.service
[Service]
Type=oneshot
User=site-proschools-publisher
Group=site-proschools-publisher
Environment=AFISHA_ROOT=/var/lib/portfolio/proschools-afisha
ExecStart=/usr/bin/python3 /srv/portfolio/proschools/static-runtime/afisha/refresh-views.py
Nice=15
CPUQuota=30%
MemoryHigh=720M
MemoryMax=768M
TimeoutStartSec=20min
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ReadWritePaths=/var/lib/portfolio/proschools-afisha /srv/portfolio/proschools/static/afisha
InaccessiblePaths=/etc/portfolio /var/lib/portfolio/proschools /home/portfolio-admin
RestrictAddressFamilies=AF_UNIX
''')
pathlib.Path('/etc/systemd/system/portfolio-afisha-views.timer').write_text('''[Unit]
Description=Keep today, tomorrow and weekend selections current
[Timer]
OnCalendar=*-*-* *:01:00
Persistent=true
Unit=portfolio-afisha-views.service
[Install]
WantedBy=timers.target
''')
subprocess.run(['systemctl','daemon-reload'],check=True);subprocess.run(['systemctl','enable','--now','portfolio-afisha-views.timer'],check=True);print('Date selections roll forward hourly; source collection remains every 48 hours')
