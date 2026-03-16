-- Insert packs de creditos
INSERT INTO packs_creditos (nombre, cantidad_creditos, precio_ars, descuento_porcentaje, popular, activo) VALUES
  ('Básico', 5, 5000, 0, false, true),
  ('Estándar', 15, 13050, 13, true, true),
  ('Profesional', 30, 23100, 23, false, true),
  ('Empresarial', 50, 33500, 33, false, true);

-- Insert configuracion de canon por servicio
INSERT INTO configuracion_canon (tipo_servicio, porcentaje_canon, creditos_base, creditos_por_hectarea, descripcion) VALUES
  ('pulverizacion', 8, 2, 0.02, 'Aplicación de productos fitosanitarios'),
  ('siembra', 10, 3, 0.025, 'Siembra directa y convencional'),
  ('cosecha', 12, 4, 0.03, 'Cosecha de granos y oleaginosas'),
  ('flete', 6, 1, 0, 'Transporte de granos, costo por tonelada');
