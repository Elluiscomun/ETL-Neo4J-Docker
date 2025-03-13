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