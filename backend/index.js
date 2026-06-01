const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
  }
);

// Modelo Tarea
const Tarea = sequelize.define('Tarea', {
  titulo: { type: DataTypes.STRING, allowNull: false },
  completada: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// Sincronizar BD con reintentos
const conectar = async () => {
  for (let i = 0; i < 10; i++) {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ force: false });
      console.log('Base de datos sincronizada');
      break;
    } catch (err) {
      console.log(`Intento ${i + 1} fallido, reintentando en 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
};

conectar();

// Rutas
app.get('/tareas', async (req, res) => {
  const tareas = await Tarea.findAll();
  res.json(tareas);
});

app.post('/tareas', async (req, res) => {
  const { titulo } = req.body;
  const tarea = await Tarea.create({ titulo });
  res.status(201).json(tarea);
});

app.put('/tareas/:id', async (req, res) => {
  const tarea = await Tarea.findByPk(req.params.id);
  if (!tarea) return res.status(404).json({ error: 'No encontrada' });
  tarea.completada = !tarea.completada;
  await tarea.save();
  res.json(tarea);
});

app.delete('/tareas/:id', async (req, res) => {
  const tarea = await Tarea.findByPk(req.params.id);
  if (!tarea) return res.status(404).json({ error: 'No encontrada' });
  await tarea.destroy();
  res.json({ mensaje: 'Eliminada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));