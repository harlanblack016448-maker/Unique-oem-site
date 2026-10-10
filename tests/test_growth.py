import unittest,re,json,subprocess
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class Tags(HTMLParser):
 def __init__(self):super().__init__();self.tags=[]
 def handle_starttag(self,t,a):self.tags.append((t,dict(a)))
class GrowthChecks(unittest.TestCase):
 def test_no_unconditional_pixels_and_shared_loading(self):
  for p in ROOT.rglob('*.html'):
   text=p.read_text()
   self.assertNotIn('px.ads.linkedin.com',text,str(p))
   if '/assets/partials.js' in text:self.assertIn('/assets/growth.js?v=4',text,str(p))
  self.assertNotIn('injectLinkedIn', (ROOT/'assets/partials.js').read_text())
 def test_ad_form_fields_links_assets_and_language_keys(self):
  text=(ROOT/'solutions/8-electrode-oem.html').read_text();parsed=Tags();parsed.feed(text)
  self.assertEqual(sum(t=='form' for t,a in parsed.tags),1)
  required={a.get('name') for t,a in parsed.tags if t in ['input','select','textarea'] and 'required' in a}
  self.assertEqual(required,{'name','company','email','inquiry_type'})
  d=json.loads(subprocess.check_output(['node','scripts/read-dictionary.cjs'],cwd=ROOT))['dict']
  self.assertEqual(set(d['en']),set(d['zh']))
  for t,a in parsed.tags:
   for attr in ['data-i18n','data-i18n-html']:
    if attr in a:self.assertIn(a[attr],d['en']);self.assertIn(a[attr],d['zh'])
   for attr in ['href','src','srcset']:
    value=a.get(attr,'')
    if value.startswith('/') and not value.startswith('/_vercel'):
     path=value.split('?')[0].split('#')[0]
     if not Path(path).suffix:path+='.html'
     self.assertTrue((ROOT/path.lstrip('/')).exists(),path)
 def test_ad_copy_and_proof_are_model_specific(self):
  text=(ROOT/'solutions/8-electrode-oem.html').read_text()
  self.assertIn('CF597, CF661 and CF625',text);self.assertIn('does not verify CF658, CF689',text)
  self.assertNotIn('World First',text);self.assertIn('data-page="lead"',text)
