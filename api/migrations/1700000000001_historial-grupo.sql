-- Up Migration

-- El historial se consulta por grupo y debe sobrevivir al borrado de una clase.
ALTER TABLE historial_cambio
  ADD COLUMN grupo_id INTEGER NOT NULL REFERENCES grupo(id) ON DELETE CASCADE;
CREATE INDEX historial_grupo_fecha_idx ON historial_cambio (grupo_id, fecha DESC);

-- Down Migration

DROP INDEX historial_grupo_fecha_idx;
ALTER TABLE historial_cambio DROP COLUMN grupo_id;
