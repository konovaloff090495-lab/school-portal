#!/usr/bin/python3
"""Identify the existing lead vaults from their private server configuration."""
from pathlib import Path
import re

PRIMARY_OPERATOR = 'gerasimov'
CONFIG_DIR = Path('/etc/portfolio-leads')
SECONDARY_MARKERS = ('delomba-backup-enabled', 'card-postback-backup-enabled')


def secondary_operator(config_dir=CONFIG_DIR):
    """Keep the configured operator name used by paths, envelopes and backups."""
    candidates = []
    marked = []
    for entry in config_dir.iterdir():
        if entry.name in (PRIMARY_OPERATOR, 'education-gifts'):
            continue
        if not re.fullmatch(r'[a-z][a-z0-9-]{0,62}', entry.name):
            continue
        if entry.is_symlink() or not entry.is_dir() or not (entry / 'backup.key').is_file():
            continue
        candidates.append(entry.name)
        if any((entry / marker).is_file() for marker in SECONDARY_MARKERS):
            marked.append(entry.name)
    matches = marked or candidates
    if len(matches) != 1:
        raise RuntimeError('Expected exactly one secondary lead vault in the private configuration')
    return matches[0]


def require_operator(operator):
    if operator == PRIMARY_OPERATOR or operator == secondary_operator():
        return operator
    raise ValueError('Unknown lead vault operator')


if __name__ == '__main__':
    print(secondary_operator())
