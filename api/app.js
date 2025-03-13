const express = require('express');
const neo4j = require('neo4j-driver');
const { Client } = require('pg');
const fs = require('fs');
const { Parser } = require('json2csv'); 

const app = express();
const port = 3000;

// Conexión a Neo4j
const driver = neo4j.driver('bolt://neo4j:7687', neo4j.auth.basic('neo4j', 'password'));

// Conexión a PostgreSQL
const pgClient = new Client({
  user: 'user',
  host: 'postgres',
  database: 'etl_db',
  password: 'password',
  port: 5432,
});

// Middleware para parsear JSON
app.use(express.json());

app.get('/api/extract', async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run('MATCH (n) RETURN n');
      const data = result.records.map(record => record.get('n').properties);
      res.json(data);
    } catch (error) {
      res.status(500).send(error);
    } finally {
      session.close();
    }
  });

// Función para transformar datos de Películas (Dataset A)
function transformMovieData(movie) {
  const nombreFormateado = movie.nombre.toLowerCase().replace(/\s+/g, '-');

  let categoriaCalificacion;
  if (movie.calificación >= 1 && movie.calificación <= 5) {
    categoriaCalificacion = "Mala";
  } else if (movie.calificación > 5 && movie.calificación <= 7) {
    categoriaCalificacion = "Regular";
  } else {
    categoriaCalificacion = "Buena";
  }

  const año = parseInt(movie.año_lanzamiento);
  const decada = `${Math.floor(año / 10) * 10}s`;

  const puntuacionAjustada = (movie.calificación * 2) - (2025 - año) / 10;

  return {
    id: movie.id,
    nombre_formateado: nombreFormateado,
    categoria_calificacion: categoriaCalificacion,
    decada: decada,
    puntuacion_ajustada: puntuacionAjustada.toFixed(2),
    fecha_procesamiento: new Date().toISOString().split('T')[0],
  };
}

// Función para insertar datos en PostgreSQL
async function insertDataIntoPostgres(transformedData) {
  const query = `
    INSERT INTO etl_data (
      id, nombre_formateado, categoria_calificacion, decada, puntuacion_ajustada,
      popularidad_categoria, velocidad_categoria, eficiencia, fecha_procesamiento
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;

  try {
    await pgClient.query(query, [
      transformedData.id,
      transformedData.nombre_formateado,
      transformedData.categoria_calificacion,
      transformedData.decada,
      transformedData.puntuacion_ajustada,
      transformedData.popularidad_categoria || null, // Si no existe, se inserta null
      transformedData.velocidad_categoria || null,
      transformedData.eficiencia || null,
      transformedData.fecha_procesamiento,
    ]);
    console.log('Datos insertados correctamente');
  } catch (error) {
    console.error('Error al insertar datos:', error);
  }
}

// Ruta para extraer, transformar y cargar datos
app.get('/api/transform-and-load', async (req, res) => {
  const session = driver.session();
  try {
    // Conectar a PostgreSQL
    await pgClient.connect();

    // Extraer datos de Neo4j
    const result = await session.run('MATCH (n) RETURN n');
    const rawData = result.records.map(record => record.get('n').properties);

    // Transformar datos
    const transformedData = rawData.map(item => {
      if (item.genero) {
        return transformMovieData(item); // Dataset A (Películas)
      }
    });

    // Cargar datos en PostgreSQL
    for (const data of transformedData) {
      if (data) { // Asegurarse de que los datos no sean undefined
        await insertDataIntoPostgres(data);
      }
    }

    // Exportar datos a CSV
    const exportPath = '/app/recap.csv'; // Ruta dentro del contenedor
    const resultExport = await pgClient.query('SELECT * FROM etl_data');
    if (resultExport.rows.length > 0) {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(resultExport.rows);
      fs.writeFileSync(exportPath, csv);
      console.log(`Archivo CSV exportado correctamente en ${exportPath}`);
    }

    res.json({ message: 'Datos transformados, cargados y exportados correctamente', filePath: exportPath });
  } catch (error) {
    console.error('Error en el proceso ETL:', error);
    res.status(500).json({ error: 'Error en el proceso ETL', details: error.message });
  } finally {
    await pgClient.end(); // Cerrar la conexión a PostgreSQL
    session.close(); // Cerrar la sesión de Neo4j
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});