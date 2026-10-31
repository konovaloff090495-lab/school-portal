import subprocess
SSH=['ssh','-o','ControlMaster=auto','-o','ControlPersist=600','-o','ControlPath=/tmp/proschools-family-ssh-%C','-o','BatchMode=yes','-o','ConnectTimeout=20','-o','BindInterface=en0','-i','/Users/dmitriikonovalov/.ssh/portfolio_security_20261024','portfolio-admin@155.212.140.76']
def run(code):
 r=subprocess.run(SSH+['sudo -n python3 -'],input=code,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr)
 return r.stdout
