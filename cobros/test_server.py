import unittest, tempfile, json, os
import server

class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        server.DB = os.path.join(self.tmp.name, 'test.sqlite3')
        server.init()
        self.order = dict(code='CL-20260922-1200-ABCDEF12',receiptKey='a'*64,name='Cliente',method='transferencia',bank='Pichincha',totalCents=7400,details='Pedido de prueba')
    def tearDown(self):
        self.tmp.cleanup()
    def post(self, path, body):
        with server.connect() as db:
            return server.mutate(path, body, db)
    def read(self):
        with server.connect() as db:
            return dict(db.execute('SELECT * FROM orders').fetchone())
    def test_retry_and_immutable_order(self):
        for _ in range(2): self.post('/api/orders', self.order)
        with server.connect() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM orders').fetchone()[0], 1)
        with self.assertRaises(ValueError): self.post('/api/orders', dict(self.order, receiptKey='b'*64))
        with self.assertRaises(ValueError): self.post('/api/orders', dict(self.order, totalCents=1))
    def test_paid_cancel_refund(self):
        self.post('/api/orders', self.order)
        base='/api/orders/'+self.order['code']
        for _ in range(2): self.post(base+'/confirm', dict(cents=7400,account='Pichincha'))
        self.assertEqual(self.read()['status'], 'paid')
        self.post(base+'/cancel', {})
        self.assertEqual(self.read()['status'], 'cancelled')
        self.assertIsNone(self.read()['refunded_at'])
        self.post(base+'/refund', {})
        self.assertTrue(self.read()['refunded_at'])
        with self.assertRaises(ValueError): self.post(base+'/confirm', dict(cents=7400,account='Pichincha'))
    def test_unpaid_cancel(self):
        self.post('/api/orders', self.order)
        self.post('/api/orders/'+self.order['code']+'/cancel', {})
        self.assertIsNone(self.read()['cents'])
        with self.assertRaises(ValueError): self.post('/api/orders/'+self.order['code']+'/refund', {})
    def test_settlement_idempotent(self):
        data=dict(id='delivery-test-123456', cents=7400, note='Produbanco')
        for _ in range(2): self.post('/api/settlements',data)
        with server.connect() as db:
            self.assertEqual(db.execute('SELECT sum(cents) FROM settlements').fetchone()[0],7400)
        with self.assertRaises(ValueError): self.post('/api/settlements',dict(data,cents=7000))
    def test_validation(self):
        for value in [True, 1.3, -1, 0, '7400']:
            with self.assertRaises(ValueError): self.post('/api/orders',dict(self.order,totalCents=value))
        with self.assertRaises(ValueError): self.post('/api/orders',dict(self.order,bank='Otra'))

if __name__ == '__main__': unittest.main()
