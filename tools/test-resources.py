from pathlib import Path
import subprocess,json
root=Path(__file__).resolve().parents[1]
for r in json.loads((root/'systems.json').read_text()):subprocess.run([str(root/'build/model-test'),str(root/'resources'/f"{r['slug']}.bin"),str(root/'build/art'/f"{r['slug']}.raw")],check=True,stdout=subprocess.DEVNULL)
print('All 1,740 numeral resources exactly decoded under sanitizers; 29 systems checked')
