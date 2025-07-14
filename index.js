const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Configura el pool de PostgreSQL usando DATABASE_URL (Railway lo inyecta)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Crea la tabla si no existe (ejecuta esto al iniciar)
const crearTabla = `
CREATE TABLE IF NOT EXISTS envios (
  id SERIAL PRIMARY KEY,
  nombre TEXT,
  cedula TEXT,
  banco TEXT,
  tipoCuenta TEXT,
  numeroCuenta TEXT,
  montoCLP FLOAT,
  tipoCambio FLOAT,
  monedaDestino TEXT,
  montoFinal FLOAT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
pool.query(crearTabla)
  .then(() => console.log("Tabla 'envios' lista"))
  .catch((err) => console.error("Error creando tabla:", err));

// Endpoint para guardar envío
app.post("/api/envios", async (req, res) => {
  const { nombre, cedula, banco, tipoCuenta, numeroCuenta, montoCLP, tipoCambio, monedaDestino } = req.body;
  // Calcula el monto final (CLP a moneda destino)
  let montoFinal = null;
  if (montoCLP && tipoCambio && !isNaN(montoCLP) && !isNaN(tipoCambio)) {
    montoFinal = parseFloat(montoCLP) * parseFloat(tipoCambio);
  }
  try {
    const result = await pool.query(
      `INSERT INTO envios (nombre, cedula, banco, tipoCuenta, numeroCuenta, montoCLP, tipoCambio, monedaDestino, montoFinal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [nombre, cedula, banco, tipoCuenta, numeroCuenta, montoCLP, tipoCambio, monedaDestino, montoFinal]
    );
    res.json({ id: result.rows[0].id, success: true });
  } catch (err) {
    console.error("Error al guardar envío:", err);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

// Endpoint para obtener los últimos 10 envíos
app.get("/api/envios", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM envios ORDER BY fecha DESC LIMIT 10"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener envíos:", err);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
