"""Prove --check-only does not modify contents, Git index or refs."""
import hashlib
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT=Path(__file__).resolve().parents[1]/'scripts/prepush.sh'
def hashes(root):
    return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
class ReleaseCheck(unittest.TestCase):
    def test_read_only_in_clean_dirty_drift_and_markup_states(self):
        for mode in ['clean','staged','drift','markup']:
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as tmp:
                root=Path(tmp);source=root/'source';clone=root/'clone';source.mkdir();clone.mkdir()
                def git(*args):return subprocess.run(['git','-C',str(clone),*args],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
                for d in [source,clone]:(d/'index.html').write_text('<h1>Original</h1>')
                git('init','-b','main');git('config','user.name','Local test');git('config','user.email','test@example.invalid');git('remote','add','origin','https://github.com/harlanblack016448-maker/Unique-oem-site.git');git('add','index.html');git('commit','-m','fixture')
                if mode=='staged':
                    for d in [source,clone]:(d/'index.html').write_text('<h1>Edited</h1>')
                    git('add','index.html')
                if mode=='drift':(source/'index.html').write_text('<h1>Source edit</h1>')
                if mode=='markup':
                    for d in [source,clone]:(d/'index.html').write_text('<h1 data-page-node-id="1">Original</h1>')
                before=hashes(root)
                env=dict(os.environ,OEM_SITE_DIR=str(source),OEM_PUSH_DIR=str(clone))
                env.pop('GIT_OPTIONAL_LOCKS',None)
                result=subprocess.run(['bash',str(SCRIPT),'--check-only'],env=env,capture_output=True,text=True)
                self.assertEqual(result.returncode,0 if mode in ['clean','staged'] else 1,result.stdout+result.stderr)
                self.assertEqual(hashes(root),before)
