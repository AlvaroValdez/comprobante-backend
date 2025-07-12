const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Usa base de datos en disco (Railway borra los archivos locales al redeploy, ¡pero para pruebas sirve!)
const db = new sqlite3.Database(path.resolve(__dirname, 'envios.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS envios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    cedula TEXT,
    banco TEXT,
    tipoCuenta TEXT,
    numeroCuenta TEXT,
    montoCLP REAL,
    tipoCambio REAL,
    monedaDestino TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Guardar envío
app.post('/api/envios', (req, res) => {
  const { nombre, cedula, banco, tipoCuenta, numeroCuenta, montoCLP, tipoCambio, monedaDestino } = req.body;
  db.run(
    `INSERT INTO envios (nombre, cedula, banco, tipoCuenta, numeroCuenta, montoCLP, tipoCambio, monedaDestino) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, cedula, banco, tipoCuenta, numeroCuenta, montoCLP, tipoCambio, monedaDestino],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

// (Opcional) Obtener lista de envíos
app.get('/api/envios', (req, res) => {
  db.all('SELECT * FROM envios ORDER BY fecha DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});