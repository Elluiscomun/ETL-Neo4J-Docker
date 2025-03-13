# ETL-Neo4J-Docker

## Proyecto ETL con Neo4j, PostgreSQL y Exportación a CSV

Este proyecto implementa un proceso ETL (Extract, Transform, Load) que extrae datos de Neo4j, los transforma según ciertos criterios, los carga en PostgreSQL y finalmente los exporta a un archivo CSV.

## Requisitos Previos

- **Docker**: Asegúrate de tener Docker y Docker Compose instalados en tu sistema.
- **Node.js**: Necesitarás Node.js y npm para ejecutar la API.

## Estructura del Proyecto

```
/proyecto_parcial/
│
├── api/                        # Carpeta para el código de la API
│   ├── app.js                  # Código principal de la API
│   ├── package.json            # Dependencias del proyecto
│   └── node_modules/           # Dependencias instaladas
│
├── data/                       # Carpeta para los archivos CSV de entrada
│   ├── dataset_a_peliculas.csv # Dataset A (Películas)
│   └── dataset_b_lenguajes.csv # Dataset B (Lenguajes de Programación)
│
├── scripts/                    # Carpeta para scripts adicionales
│   └── init_db.sql             # Script para crear la tabla en PostgreSQL
│
├── docker-compose.yml          # Archivo para orquestar los contenedores
└── README.md                   # Este archivo
```

## Configuración del Entorno

### Clona el Repositorio:
```bash
git clone <url-del-repositorio>
cd proyecto_parcial
```

### Instala las Dependencias:
```bash
cd api
npm install
```

### Cargar Datos en Neo4j:
1. Asegúrate de que el archivo `dataset_a_peliculas.csv` esté en la carpeta `data/`.
2. Inicia Neo4j en Docker:
   ```bash
   docker-compose up neo4j
   ```
3. Accede a Neo4j Browser en [http://localhost:7474](http://localhost:7474).
4. Ejecuta el siguiente comando para cargar los datos:
   ```cypher
   LOAD CSV WITH HEADERS FROM 'file:///dataset_a_peliculas.csv' AS row
   CREATE (:Pelicula {
       id: row.id,
       nombre: row.nombre,
       calificación: toFloat(row.calificación),
       año_lanzamiento: toInteger(row.año_lanzamiento),
       genero: row.genero
   });
   ```

### Iniciar los Contenedores:

Levanta todos los servicios (Neo4j, PostgreSQL y la API):
```bash
docker-compose up --build
```

## Ejecutar el Proceso ETL

### Acceder a la Ruta ETL:
Una vez que los contenedores estén en funcionamiento, accede a la siguiente ruta para ejecutar el proceso ETL:
```bash
curl http://localhost:3000/api/transform-and-load
```
Esto extraerá los datos de Neo4j, los transformará, los cargará en PostgreSQL y los exportará a un archivo CSV.

### Verificar el Archivo CSV:
- El archivo CSV se generará en la ruta `./api/recap.csv` dentro del contenedor.
- Si estás usando Docker, el archivo estará disponible en la carpeta `./api` de tu proyecto.

## Estructura de la Tabla `etl_data` en PostgreSQL

La tabla `etl_data` tiene la siguiente estructura:
```sql
CREATE TABLE etl_data (
    id VARCHAR(255),
    nombre_formateado VARCHAR(255),
    categoria_calificacion VARCHAR(50), -- Solo para películas
    decada VARCHAR(20), -- Solo para películas
    puntuacion_ajustada FLOAT, -- Solo para películas
    popularidad_categoria VARCHAR(50), -- Solo para lenguajes
    velocidad_categoria VARCHAR(50), -- Solo para lenguajes
    eficiencia FLOAT, -- Solo para lenguajes
    fecha_procesamiento DATE
);
```

## Exportación a CSV

El archivo CSV generado (`recap.csv`) tendrá el siguiente formato:

### Para Películas (Dataset A)
```
Nombre Formateado,Categoria Calificación,Década,Puntuación Ajustada,Fecha Procesamiento
the-dark-knight,Buena,2000s,8.7,2025-03-09
inception,Buena,2010s,9.1,2025-03-09
```


