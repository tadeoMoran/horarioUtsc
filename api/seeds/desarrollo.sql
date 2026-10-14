-- Datos SINTÉTICOS solo para desarrollo local. No son horarios reales de la UTSC.
INSERT INTO carrera (nombre) VALUES ('Ing. en Desarrollo y Gestión de Software');
INSERT INTO grupo (carrera_id, cuatrimestre, letra) VALUES (1, 10, 'B');
INSERT INTO materia (nombre, docente) VALUES
  ('Desarrollo Móvil Integral', NULL),
  ('Bases de Datos', NULL),
  ('Inglés', NULL);
-- Martes (dia_semana = 2)
INSERT INTO clase (grupo_id, materia_id, dia_semana, hora_inicio, hora_fin, aula, estado) VALUES
  (1, 1, 2, '07:00', '08:40', 'Lab. 3', 'normal'),
  (1, 2, 2, '08:40', '10:20', 'Aula 12', 'aula_cambiada'),
  (1, 3, 2, '10:30', '12:10', 'Aula 5', 'cancelada');
