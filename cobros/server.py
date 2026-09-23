"""Registro compartido de Clowder. Python 3.9+, SQLite, sin dependencias."""
import os, json, sqlite3, hmac, re
from pathlib import Path
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlsplit

BANKS = ['Guayaquil', 'Pichincha', 'Bolivariano', 'Pacífico', 'Produbanco']
DB = os.environ.get('CLOWDER_DB', str(Path(__file__).with_name('data.sqlite3')))
TOKEN = os.environ.get('CLOWDER_ADMIN_TOKEN', '')
ORIGINS = set(filter(None, os.environ.get('CLOWDER_ORIGINS', '').split(',')))
ROOT = Path(__file__).parent

def now():
    return datetime.now(timezone.utc).isoformat()

def connect():
    db = sqlite3.connect(DB, timeout=10)
    db.row_factory = sqlite3.Row
    return db

def init():
    with connect() as db:
        db.executescript('''
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS orders (
          code TEXT PRIMARY KEY, receipt_key TEXT NOT NULL, payload TEXT NOT NULL,
          created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
          cents INTEGER, account TEXT, paid_at TEXT, cancelled_at TEXT, refunded_at TEXT);
        CREATE TABLE IF NOT EXISTS settlements (
          id TEXT PRIMARY KEY, cents INTEGER NOT NULL, created_at TEXT NOT NULL, note TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS audit (
          id INTEGER PRIMARY KEY, created_at TEXT NOT NULL, action TEXT NOT NULL, reference TEXT NOT NULL);
        ''')

def amount(value):
    if type(value) is not int or not 1 <= value <= 10000000:
        raise ValueError('Monto inválido; usa centavos enteros mayores que cero.')
    return value

def audit(db, action, reference):
    db.execute('INSERT INTO audit(created_at,action,reference) VALUES(?,?,?)', (now(), action, reference))

def validate_order(data):
    if not re.fullmatch(r'CL-[A-Z0-9-]{10,60}', data.get('code', '')):
        raise ValueError('Número de pedido inválido.')
    if not re.fullmatch(r'[a-f0-9]{64}', data.get('receiptKey', '')):
        raise ValueError('Clave de pedido inválida.')
    amount(data.get('totalCents'))
    if data.get('method') not in ['efectivo', 'transferencia']:
        raise ValueError('Medio de pago inválido.')
    if data['method'] == 'transferencia' and data.get('bank') not in BANKS:
        raise ValueError('Selecciona el banco receptor.')
    if not isinstance(data.get('name'), str) or not 1 <= len(data['name'].strip()) <= 80:
        raise ValueError('Nombre inválido.')
    if not isinstance(data.get('details'), str) or not 1 <= len(data['details']) <= 16000:
        raise ValueError('Detalle de pedido inválido.')
    return {k: data.get(k, '') for k in ['code', 'name', 'method', 'bank', 'totalCents', 'details']}

def mutate(path, data, db):
    db.execute('BEGIN IMMEDIATE')
    if path == '/api/orders':
        payload = validate_order(data)
        old = db.execute('SELECT * FROM orders WHERE code=?', (data['code'],)).fetchone()
        encoded = json.dumps(payload, sort_keys=True, ensure_ascii=False)
        if old:
            if not hmac.compare_digest(old['receipt_key'], data['receiptKey']):
                raise ValueError('El número de pedido ya existe.')
            if old['payload'] != encoded:
                raise ValueError('Este pedido ya fue registrado. Empieza un pedido nuevo para cambiarlo.')
        else:
            db.execute('INSERT INTO orders(code,receipt_key,payload,created_at) VALUES(?,?,?,?)',
                       (data['code'], data['receiptKey'], encoded, now()))
            audit(db, 'created', data['code'])
        return {'ok': True}
    if path == '/api/settlements':
        cents = amount(data.get('cents'))
        key = data.get('id', '')
        note = data.get('note', '')
        if not re.fullmatch(r'[a-zA-Z0-9-]{16,80}', key) or not isinstance(note, str) or len(note) > 500:
            raise ValueError('Entrega inválida.')
        old = db.execute('SELECT * FROM settlements WHERE id=?', (key,)).fetchone()
        if old:
            if old['cents'] != cents or old['note'] != note:
                raise ValueError('Esta entrega ya existe con otros datos.')
        else:
            db.execute('INSERT INTO settlements VALUES(?,?,?,?)', (key, cents, now(), note))
            audit(db, 'settlement', key)
        return {'ok': True}
    match = re.fullmatch(r'/api/orders/(CL-[A-Z0-9-]{10,60})/(confirm|cancel|refund)', path)
    if not match:
        raise ValueError('Acción desconocida.')
    code, action = match.groups()
    order = db.execute('SELECT * FROM orders WHERE code=?', (code,)).fetchone()
    if not order:
        raise ValueError('Pedido inexistente.')
    if action == 'confirm':
        cents = amount(data.get('cents'))
        account = data.get('account')
        if account not in BANKS + ['Efectivo']:
            raise ValueError('Cuenta inválida.')
        if order['status'] == 'paid' and order['cents'] == cents and order['account'] == account:
            return {'ok': True}
        if order['status'] != 'pending':
            raise ValueError('Solo puedes cobrar un pedido pendiente.')
        db.execute("UPDATE orders SET status='paid', cents=?, account=?, paid_at=? WHERE code=?", (cents, account, now(), code))
    elif action == 'cancel':
        if order['status'] == 'cancelled':
            return {'ok': True}
        db.execute("UPDATE orders SET status='cancelled', cancelled_at=? WHERE code=?", (now(), code))
    else:
        if order['status'] != 'cancelled' or not order['paid_at']:
            raise ValueError('Solo puedes devolver un pedido cobrado y cancelado.')
        if order['refunded_at']:
            return {'ok': True}
        db.execute('UPDATE orders SET refunded_at=? WHERE code=?', (now(), code))
    audit(db, action, code)
    return {'ok': True}

class Handler(BaseHTTPRequestHandler):
    # No registra cuerpos, claves ni nombres de clientes.
    def log_message(self, fmt, *args):
        pass

    def reply(self, status, data, content_type='application/json; charset=utf-8'):
        body = json.dumps(data, ensure_ascii=False).encode() if content_type.startswith('application/json') else data
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        origin = self.headers.get('Origin')
        if origin in ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()
        self.wfile.write(body)

    def authorized(self):
        return bool(TOKEN) and hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + TOKEN)

    def do_OPTIONS(self):
        self.reply(200, {})

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/health':
            return self.reply(200, {'ok': True})
        if path == '/api/admin':
            if not self.authorized():
                return self.reply(401, {'error': 'Clave de acceso incorrecta.'})
            with connect() as db:
                orders = [dict(r) for r in db.execute('SELECT code,payload,created_at,status,cents,account,paid_at,cancelled_at,refunded_at FROM orders ORDER BY created_at DESC')]
                settlements = [dict(r) for r in db.execute('SELECT * FROM settlements ORDER BY created_at DESC')]
            for order in orders:
                order['payload'] = json.loads(order['payload'])
            return self.reply(200, {'orders': orders, 'settlements': settlements})
        files = {'/': ('admin.html', 'text/html'), '/admin.js': ('admin.js', 'text/javascript'), '/admin.css': ('admin.css', 'text/css'), '/ledger.js': ('ledger.js', 'text/javascript')}
        if path in files:
            name, mime = files[path]
            return self.reply(200, (ROOT / name).read_bytes(), mime + '; charset=utf-8')
        self.reply(404, {'error': 'No encontrado.'})

    def do_POST(self):
        path = urlsplit(self.path).path
        if path != '/api/orders' and not self.authorized():
            return self.reply(401, {'error': 'Clave de acceso incorrecta.'})
        # Exigir JSON evita envíos cross-site mediante formularios HTML.
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            return self.reply(415, {'error': 'Se requiere JSON.'})
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 1 <= size <= 32768:
                raise ValueError('Tamaño de pedido inválido.')
            self.connection.settimeout(15)
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError('Datos inválidos.')
            with connect() as db:
                result = mutate(path, data, db)
            self.reply(200, result)
        except (ValueError, TypeError) as error:
            self.reply(400, {'error': str(error)})
        except Exception:
            self.reply(500, {'error': 'No se pudo guardar. Reintenta sin cambiar los datos.'})

if __name__ == '__main__':
    if len(TOKEN) < 32:
        raise SystemExit('Configura CLOWDER_ADMIN_TOKEN con al menos 32 caracteres aleatorios.')
    init()
    ThreadingHTTPServer((os.environ.get('HOST', '127.0.0.1'), int(os.environ.get('PORT', '8787'))), Handler).serve_forever()
