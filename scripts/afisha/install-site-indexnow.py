"""Server-side IndexNow for every sitemap; no Webmaster OAuth credential is stored here."""
import pathlib,subprocess
state='/var/lib/portfolio/proschools-indexing';assert pathlib.Path(state+'/public-key.json').exists()
pathlib.Path('/etc/systemd/system/portfolio-site-indexnow.service').write_text('''[Unit]
Description=Notify IndexNow of new ProSchools pages in all website sitemaps
After=network-online.target
[Service]
Type=oneshot
User=site-proschools-publisher
Group=site-proschools-publisher
ExecStart=/usr/bin/python3 /srv/portfolio/proschools/static-runtime/afisha/notify-site-indexnow.py
Nice=15
CPUQuota=25%
MemoryMax=256M
TimeoutStartSec=15min
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/portfolio/proschools-indexing
InaccessiblePaths=/etc/portfolio /var/lib/portfolio/proschools /home/portfolio-admin
''')
pathlib.Path('/etc/systemd/system/portfolio-site-indexnow.timer').write_text('''[Unit]
Description=Safety scan of every ProSchools sitemap every 48 hours
[Timer]
OnBootSec=15min
OnUnitActiveSec=48h
Persistent=true
Unit=portfolio-site-indexnow.service
[Install]
WantedBy=timers.target
''')
p=pathlib.Path('/etc/systemd/system/portfolio-afisha-refresh.service');text=p.read_text()
if state not in text:
 text=text.replace('ReadWritePaths=/var/lib/portfolio/proschools-afisha /srv/portfolio/proschools/static/afisha','ReadWritePaths=/var/lib/portfolio/proschools-afisha /srv/portfolio/proschools/static/afisha '+state);p.write_text(text)
subprocess.run(['systemctl','daemon-reload'],check=True);subprocess.run(['systemctl','enable','--now','portfolio-site-indexnow.timer'],check=True)
print('All-site IndexNow enabled: after Afisha publication and a 48-hour safety scan')
