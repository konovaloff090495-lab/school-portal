"""Install a small read-only renderer for complete HTML with shared navigation."""
import pathlib,subprocess,urllib.request,shutil,datetime
H=pathlib.Path('/srv/portfolio/proschools/static-runtime/afisha');assert(H/'html-server.py').exists()
unit=pathlib.Path('/etc/systemd/system/portfolio-afisha-html.service');unit.write_text('''[Unit]
Description=ProSchools Afisha complete HTML with shared navigation
After=network.target
[Service]
Type=simple
User=site-proschools-publisher
Group=site-proschools-publisher
ExecStart=/usr/bin/python3 /srv/portfolio/proschools/static-runtime/afisha/html-server.py
Environment=AFISHA_HTML_ROOT=/srv/portfolio/proschools/static/afisha/current
Environment=AFISHA_HTML_PORT=3199
Restart=on-failure
RestartSec=2
MemoryMax=192M
CPUQuota=50%
TasksMax=64
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
CapabilityBoundingSet=
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
InaccessiblePaths=/etc/portfolio /var/lib/portfolio /home/portfolio-admin
[Install]
WantedBy=multi-user.target
''')
subprocess.run(['systemctl','daemon-reload'],check=True);subprocess.run(['systemctl','enable','--now','portfolio-afisha-html.service'],check=True)
for i in range(30):
 try:
  assert urllib.request.urlopen('http://127.0.0.1:3199/healthz',timeout=2).read()==b'ok';break
 except Exception:
  import time;time.sleep(.2)
else:raise RuntimeError('HTML service is not healthy; nginx unchanged')
p=pathlib.Path('/etc/nginx/snippets/proschools-afisha.conf');old=p.read_text();backup=p.with_name('proschools-afisha.conf.before-shared-html-20261031')
if not backup.exists():backup.write_text(old)
if '@proschools_afisha_html'not in old:
 new=old.replace(' try_files $uri $uri/index.html =404;', ' error_page 418 = @proschools_afisha_html;\n if ($uri ~ "/$") { return 418; }\n try_files $uri $uri/index.html =404;')+'''
location @proschools_afisha_html {
 proxy_pass http://127.0.0.1:3199;
 proxy_set_header Host $host;
 proxy_hide_header Cache-Control;
 proxy_hide_header X-Content-Type-Options;
 proxy_connect_timeout 3s;
 proxy_read_timeout 15s;
 add_header X-Content-Type-Options nosniff always;
 add_header Referrer-Policy strict-origin-when-cross-origin always;
 add_header Cache-Control "public, max-age=120, must-revalidate" always;
}
''';p.write_text(new)
 try:subprocess.run(['nginx','-t'],check=True)
 except Exception:p.write_text(old);raise
 subprocess.run(['systemctl','reload','nginx'],check=True)
if 'proxy_hide_header Cache-Control;'not in p.read_text():
 text=p.read_text();p.write_text(text.replace(' proxy_set_header Host $host;',' proxy_set_header Host $host;\n proxy_hide_header Cache-Control;\n proxy_hide_header X-Content-Type-Options;'));subprocess.run(['nginx','-t'],check=True);subprocess.run(['systemctl','reload','nginx'],check=True)
print('Read-only Afisha HTML service enabled; other site routes unchanged')
