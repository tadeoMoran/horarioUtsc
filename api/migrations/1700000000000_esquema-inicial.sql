-- Up Migration

CREATE TYPE estado_clase AS ENUM ('normal', 'aula_cambiada', 'cancelada');
CREATE TYPE tipo_aviso AS ENUM ('cambio_aula', 'clase_cancelada', 'general');

CREATE TABLE carrera (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE grupo (
  id            SERIAL PRIMARY KEY,
  carrera_id    INTEGER NOT NULL REFERENCES carrera(id) ON DELETE RESTRICT,
  cuatrimestre  SMALLINT NOT NULL CHECK (cuatrimestre BETWEEN 1 AND 11),
  letra         CHAR(1) NOT NULL,
  UNIQUE (carrera_id, cuatrimestre, letra)
);

CREATE TABLE administrador (
  id               SERIAL PRIMARY KEY,
  nombre           VARCHAR(120) NOT NULL,
  correo           VARCHAR(160) NOT NULL UNIQUE,
  contrasena_hash  VARCHAR(100) NOT NULL,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un administrador puede gestionar varios grupos (docente o coordinación).
CREATE TABLE administrador_grupo (
  administrador_id  INTEGER NOT NULL REFERENCES administrador(id) ON DELETE CASCADE,
  grupo_id          INTEGER NOT NULL REFERENCES grupo(id) ON DELETE CASCADE,
  PRIMARY KEY (administrador_id, grupo_id)
);

CREATE TABLE materia (
  id       SERIAL PRIMARY KEY,
  nombre   VARCHAR(120) NOT NULL UNIQUE,
  docente  VARCHAR(120)
);

CREATE TABLE clase (
  id            SERIAL PRIMARY KEY,
  grupo_id      INTEGER NOT NULL REFERENCES grupo(id) ON DELETE CASCADE,
  materia_id    INTEGER NOT NULL REFERENCES materia(id) ON DELETE RESTRICT,
  dia_semana    SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1 = lunes
  hora_inicio   TIME NOT NULL,
  hora_fin      TIME NOT NULL,
  aula          VARCHAR(40) NOT NULL,
  estado        estado_clase NOT NULL DEFAULT 'normal',
  CHECK (hora_fin > hora_inicio)
);
CREATE INDEX clase_grupo_dia_idx ON clase (grupo_id, dia_semana, hora_inicio);

CREATE TABLE aviso (
  id                SERIAL PRIMARY KEY,
  grupo_id          INTEGER NOT NULL REFERENCES grupo(id) ON DELETE CASCADE,
  clase_id          INTEGER REFERENCES clase(id) ON DELETE SET NULL,
  administrador_id  INTEGER NOT NULL REFERENCES administrador(id) ON DELETE RESTRICT,
  tipo              tipo_aviso NOT NULL,
  mensaje           VARCHAR(500) NOT NULL,
  fecha             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX aviso_grupo_fecha_idx ON aviso (grupo_id, fecha DESC);

CREATE TABLE dispositivo (
  id              SERIAL PRIMARY KEY,
  grupo_id        INTEGER NOT NULL REFERENCES grupo(id) ON DELETE CASCADE,
  token_push      VARCHAR(255) NOT NULL UNIQUE,
  fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX dispositivo_grupo_idx ON dispositivo (grupo_id);

CREATE TABLE historial_cambio (
  id                SERIAL PRIMARY KEY,
  clase_id          INTEGER REFERENCES clase(id) ON DELETE SET NULL,
  administrador_id  INTEGER NOT NULL REFERENCES administrador(id) ON DELETE RESTRICT,
  campo             VARCHAR(40) NOT NULL,
  valor_anterior    VARCHAR(200),
  valor_nuevo       VARCHAR(200),
  fecha             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX historial_clase_fecha_idx ON historial_cambio (clase_id, fecha DESC);

-- Down Migration

DROP TABLE historial_cambio;
DROP TABLE dispositivo;
DROP TABLE aviso;
DROP TABLE clase;
DROP TABLE materia;
DROP TABLE administrador_grupo;
DROP TABLE administrador;
DROP TABLE grupo;
DROP TABLE carrera;
DROP TYPE tipo_aviso;
DROP TYPE estado_clase;
