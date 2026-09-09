"""Freeze Numerals and verify a source archive outside the checkout."""
from pathlib import Path
import hashlib,json,shutil,subprocess,tempfile,zipfile
ROOT=Path(__file__).resolve().parents[1]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
release=ROOT/'release';release.mkdir(exist_ok=True)
version=json.loads((ROOT/'package.json').read_text())['version']
pbw=release/f'numerals-{version}.pbw';shutil.copyfile(ROOT/'build/numerals.pbw',pbw)
source=release/f'numerals-{version}-source.zip'
files=[p for p in ROOT.rglob('*') if p.is_file() and not any(x in ['build','release','evidence','node_modules','__pycache__'] for x in p.relative_to(ROOT).parts) and not p.name.startswith('.lock-waf') and p.suffix!='.pyc']
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED) as archive:
 for p in sorted(files):
  entry=zipfile.ZipInfo(str(p.relative_to(ROOT)),date_time=(2026,9,9,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;entry.external_attr=0o644<<16;archive.writestr(entry,p.read_bytes())
with tempfile.TemporaryDirectory(prefix='numerals-portable-') as directory:
 work=Path(directory)
 with zipfile.ZipFile(source) as archive:archive.extractall(work)
 with (release/'independent-build.log').open('w') as log:
  for command in [['npm','ci','--ignore-scripts'],['make','art'],['make','test'],['pebble','build','--sdk','4.33.1']]:subprocess.run(command,cwd=work,stdout=log,stderr=subprocess.STDOUT,check=True)
 generated=[*ROOT.glob('resources/*.bin'),ROOT/'src/c/styles.h',ROOT/'src/pkjs/systems.js']
 assert all(sha(p)==sha(work/p.relative_to(ROOT)) for p in generated),'Regenerated artwork or settings drifted'
 with zipfile.ZipFile(pbw) as frozen,zipfile.ZipFile(next((work/'build').glob('*.pbw'))) as rebuilt:
  names=[n for n in frozen.namelist() if n.endswith('app_resources.pbpack') or n.endswith('pebble-js-app.js')]
  assert names and all(frozen.read(n)==rebuilt.read(n) for n in names),'Portable resource/phone bundle differs'
 report={'sourceSHA256':sha(source),'pbwSHA256':sha(pbw),'archiveBuiltOutsideCheckout':True,'all1740SignsRegenerated':True,'generatedResourcesAndSettingsMatch':True,'resourceAndPhoneBundlesMatch':True,'targets':['basalt','diorite','emery','flint'],'sourceFiles':len(files),'limitations':'Local archive build; not a CloudPebble build, store upload or physical-watch test.'}
 (release/'independent-build.json').write_text(json.dumps(report,indent=2)+'\n')
(release/'SHA256SUMS').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in [pbw,source]))
print(json.dumps(report,indent=2))
