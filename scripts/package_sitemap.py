#!/usr/bin/env python3
"""Build the installable WordPress plugin from its tracked source."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / 'integrations' / 'ivan-sitemap.zip'
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.write(root / 'integrations' / 'ivan-sitemap.php', 'ivan-sitemap/ivan-sitemap.php')
print(output)
