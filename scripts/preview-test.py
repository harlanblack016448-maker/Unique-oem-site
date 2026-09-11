"""Loopback-only preview with opt-in local form receipts and external requests blocked.

Run python3 -B scripts/preview-test.py --port 8097, then open
/contact.html?receipt=success (also failure, malformed, slow).
No submitted form values are stored or forwarded.
"""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import time
from urllib.parse import urlparse,parse_qs

ROOT=Path(__file__).resolve().parents[1]
class Preview(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def end_headers(self):
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; form-action 'self'")
        self.send_header('Cache-Control','no-store')
        super().end_headers()
    def do_GET(self):
        parsed=urlparse(self.path)
        mode=parse_qs(parsed.query).get('receipt',[''])[0]
        if parsed.path in ['/index.html','/','/contact.html'] and mode in ['success','failure','malformed','slow']:
            file='contact.html' if parsed.path=='/contact.html' else 'index.html'
            text=(ROOT/file).read_text()
            text=text.replace('action="https://formsubmit.co/hanhan@lefu.cc"',f'action="/_test/receipt?mode={mode}"')
            text=text.replace('</head>','<script>window.lintrk = function(action) {if(action === "track") document.body.dataset.testConversions = String(Number(document.body.dataset.testConversions || 0) + 1);};</script></head>')
            body=text.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);return
        if parsed.path.startswith('/_vercel/'):
            self.send_response(204);self.end_headers();return
        super().do_GET()
    def do_POST(self):
        parsed=urlparse(self.path)
        if parsed.path!='/_test/receipt':self.send_error(404);return
        self.rfile.read(min(int(self.headers.get('Content-Length','0')),100000))
        mode=parse_qs(parsed.query).get('mode',['failure'])[0]
        if mode=='slow':time.sleep(17)
        body=b'<html>Not a receipt</html>' if mode=='malformed' else (b'{"success":true}' if mode=='success' else b'{"success":false}')
        try:
            self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(body)
        except (BrokenPipeError,ConnectionResetError):pass
    def log_message(self,*args):pass
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8097);args=parser.parse_args()
    print(f'Local isolated preview: http://127.0.0.1:{args.port}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Preview).serve_forever()
