#!/usr/bin/env python3
"""Loopback-only QA: simulate submissions and LinkedIn; never contacts either provider."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
QA='''<script>
document.addEventListener('DOMContentLoaded',function(){
 const box=document.createElement('details');box.id='qa-tools';box.style='padding:16px;background:#fff3cd;color:#171717';box.innerHTML='<summary>LOCAL QA — simulated services</summary><label>Submission result <select id="qa-result"><option value="success">Success</option><option value="failure">Failure</option></select></label><pre id="qa-payload" style="white-space:pre-wrap"></pre><p id="qa-events">LinkedIn events: 0</p><p id="qa-scripts">LinkedIn scripts: 0</p>';document.body.appendChild(box);
});
let qaCount=0;window.__us_sendInquiry=async function(url,data){
 const pre=document.getElementById('qa-payload');pre.textContent=JSON.stringify(Object.fromEntries(data),null,2);
 await new Promise(r=>setTimeout(r,600));
 if(document.getElementById('qa-result').value==='failure')throw Error('Simulated failure');
 return {success:true};
};
</script>'''
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
 def end_headers(self):
  self.send_header('Cache-Control','no-store')
  self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'none'")
  super().end_headers()
 def do_GET(self):
  path=self.path.split('?')[0]
  if path=='/qa/linkedin.js':
   self.respond('application/javascript',b"document.getElementById('qa-scripts').textContent='LinkedIn scripts: 1';window.lintrk=function(){document.getElementById('qa-events').textContent='LinkedIn events: '+(++qaCount)};")
   return
  candidate=ROOT/path.lstrip('/')
  if path=='/':candidate=ROOT/'index.html'
  elif not candidate.suffix:candidate=candidate.with_suffix('.html')
  if candidate.is_file() and candidate.resolve().is_relative_to(ROOT):
   text=None
   if candidate.suffix=='.html':
    text=candidate.read_text().replace('<script src="/assets/form.js',QA+'<script src="/assets/form.js')
    text=text.replace('<script defer src="/_vercel/insights/script.js"></script>','')
    self.respond('text/html; charset=utf-8',text.encode());return
   if path=='/assets/growth.js':
    text=candidate.read_text().replace('https://snap.licdn.com/li.lms-analytics/insight.min.js','/qa/linkedin.js')
   if path=='/assets/form.js':
    text=candidate.read_text();text=text.replace('window.location.href = "mailto:" + EMAIL + "?subject=" +','document.getElementById("qa-payload").textContent += "\\nMAILTO FALLBACK (NOT OPENED): " +').replace('encodeURIComponent("Website inquiry — "','encodeURIComponent("Website inquiry — "')
   if text is not None:self.respond('application/javascript; charset=utf-8',text.encode());return
  if path.startswith('/api/') or path.startswith('/_vercel/'):
   self.respond('application/json',b'{"qa":"unavailable"}');return
  super().do_GET()
 def respond(self,mime,data):
  self.send_response(200);self.send_header('Content-Type',mime);self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
if __name__=='__main__':
 print('QA server: http://127.0.0.1:8092 — submissions and ads simulated',flush=True)
 ThreadingHTTPServer(('127.0.0.1',8092),Handler).serve_forever()
