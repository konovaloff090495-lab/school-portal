import pathlib,subprocess,datetime,sys,json,os
runtime=pathlib.Path('/srv/portfolio/proschools/static-runtime/afisha');state=pathlib.Path('/var/lib/portfolio/proschools-afisha');static=pathlib.Path('/srv/portfolio/proschools/static/afisha');release=static/'releases'/sys.argv[1]
assert (release/'afisha/status.json').exists()
if not(static/'current').exists():(static/'current').symlink_to(release)
snippet=pathlib.Path('/etc/nginx/snippets/proschools-afisha.conf')
snippet.write_text('''# ProSchools afisha: independent atomic static releases.
location = /afisha { return 301 /afisha/$is_args$args; }
location ^~ /afisha/ {
 root /srv/portfolio/proschools/static/afisha/current;
 index index.html;
 gzip_static always;
 gunzip on;
 if ($uri ~ "^(/afisha/[^.]*[^/])$") { return 301 $1/$is_args$args; }
 try_files $uri $uri/index.html =404;
 add_header X-Content-Type-Options nosniff always;
 add_header Referrer-Policy strict-origin-when-cross-origin always;
 add_header Cache-Control "public, max-age=120, must-revalidate" always;
}
location ^~ /site-navigation/ {
 root /srv/portfolio/proschools/static/navigation;
 try_files $uri =404;
 add_header X-Content-Type-Options nosniff always;
 add_header Cache-Control "public, max-age=120, must-revalidate" always;
}
''')
conf=pathlib.Path('/etc/nginx/sites-enabled/proschools-clean');original=conf.read_text();marker=' include /etc/nginx/snippets/proschools-afisha.conf;'
if marker not in original:conf.write_text(original.replace(' include /etc/nginx/snippets/portfolio-external-monitor.conf;',marker+'\n include /etc/nginx/snippets/portfolio-external-monitor.conf;',1))
try:subprocess.run(['nginx','-t'],check=True)
except:conf.write_text(original);raise
unit=pathlib.Path('/etc/systemd/system/portfolio-afisha-refresh.service')
unit.write_text('''[Unit]
Description=Refresh and publish ProSchools event catalogue every 48 hours
After=network-online.target
Wants=network-online.target
[Service]
Type=oneshot
User=site-proschools-publisher
Group=site-proschools-publisher
Environment=AFISHA_ROOT=/var/lib/portfolio/proschools-afisha
Environment=AFISHA_STATIC=/srv/portfolio/proschools/static/afisha
EnvironmentFile=-/etc/portfolio/afisha.env
ExecStart=/usr/bin/python3 /srv/portfolio/proschools/static-runtime/afisha/refresh.py
TimeoutStartSec=90min
Nice=10
CPUQuota=50%
MemoryHigh=700M
MemoryMax=768M
ReadWritePaths=/var/lib/portfolio/proschools-afisha /srv/portfolio/proschools/static/afisha
InaccessiblePaths=/etc/portfolio /var/lib/portfolio/proschools /var/lib/portfolio/education-gifts /home/portfolio-admin/migration
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
NoNewPrivileges=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
RestrictNamespaces=true
CapabilityBoundingSet=
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
UMask=0022
''')
pathlib.Path('/etc/systemd/system/portfolio-afisha-refresh.timer').write_text('''[Unit]
Description=ProSchools afisha automatic update every two days
[Timer]
OnBootSec=20min
OnUnitActiveSec=2d
AccuracySec=1min
Unit=portfolio-afisha-refresh.service
[Install]
WantedBy=timers.target
''')
# Preserve all existing robots directives and sitemap references.
robots=pathlib.Path('/srv/portfolio/proschools/static/courses/robots.txt');text=robots.read_text();line='Sitemap: https://pro-schools.ru/afisha/sitemap.xml'
if line not in text:robots.write_text(text.rstrip()+'\n'+line+'\n')
subprocess.run(['systemctl','daemon-reload'],check=True);subprocess.run(['systemctl','reload','nginx'],check=True)
print('Afisha routes and isolated 48h service installed; timer awaits first verified run')
