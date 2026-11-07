"""Local server for Perfume Atelier: serves the app and stores notebook formulas in SQLite.

Run: python server.py  (then open http://localhost:4173). Data lives in atelier.db next to this file.
"""
import json, sqlite3
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB = ROOT / 'atelier.db'


def db():
    con = sqlite3.connect(DB)
    con.execute('CREATE TABLE IF NOT EXISTS formulas (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated TEXT NOT NULL)')
    return con


class Handler(SimpleHTTPRequestHandler):
    def send_json(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.split('?')[0] != '/api/formulas':
            return super().do_GET()
        with db() as con:
            rows = con.execute('SELECT data FROM formulas ORDER BY updated DESC').fetchall()
        self.send_json(200, [json.loads(r[0]) for r in rows])

    def do_PUT(self):
        # Replace the whole notebook with the posted list (the app always sends its full state).
        if self.path != '/api/formulas':
            return self.send_json(404, {'error': 'not found'})
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length > 10_000_000:
                raise ValueError
            formulas = json.loads(self.rfile.read(length))
            if not isinstance(formulas, list) or not all(isinstance(f, dict) and isinstance(f.get('id'), str) for f in formulas):
                raise ValueError
        except ValueError:
            return self.send_json(400, {'error': 'invalid formulas'})
        with db() as con:
            con.execute('DELETE FROM formulas')
            con.executemany('INSERT INTO formulas VALUES (?,?,?)',
                            [(f['id'], json.dumps(f, ensure_ascii=False), str(f.get('date', ''))) for f in formulas])
        self.send_json(200, {'saved': len(formulas)})


if __name__ == '__main__':
    db().close()
    print('Perfume Atelier running at http://localhost:4173  (formulas saved in atelier.db)')
    ThreadingHTTPServer(('127.0.0.1', 4173), partial(Handler, directory=str(ROOT))).serve_forever()
