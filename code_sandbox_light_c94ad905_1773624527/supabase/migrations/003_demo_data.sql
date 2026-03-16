-- Este script crea usuarios demo para testing
-- IMPORTANTE: Primero debes crear estos usuarios manualmente en Supabase Auth
-- y luego usar sus UUIDs aquí

-- Usuarios demo de prueba
-- Para crear usuarios en Supabase Auth:
-- 1. Ir a Authentication → Users → Add user
-- 2. Crear con estos emails y password: demo123
-- 3. Copiar los UUIDs generados
-- 4. Reemplazar los UUIDs de abajo con los reales

-- USUARIO CLIENTE 1 (Buenos Aires)
-- Email: cliente.demo@agroconnect.ar
-- Password: demo123
INSERT INTO usuarios (
  id,
  email,
  nombre,
  telefono,
  tipo,
  provincia,
  localidad,
  latitud,
  longitud,
  descripcion,
  creditos_disponibles,
  activo
) VALUES (
  'UUID_CLIENTE_1_AQUI',  -- Reemplazar con UUID real
  'cliente.demo@agroconnect.ar',
  'Juan Pérez - Establecimiento Los Robles',
  '+54 9 11 4567-8901',
  'cliente',
  'Buenos Aires',
  'Pergamino',
  -33.8897,
  -60.5736,
  'Campo mixto de 500 ha en zona núcleo. Cultivos: soja, maíz, trigo.',
  0,
  true
);

-- USUARIO CLIENTE 2 (Córdoba)
-- Email: cliente2.demo@agroconnect.ar
-- Password: demo123
INSERT INTO usuarios (
  id,
  email,
  nombre,
  telefono,
  tipo,
  provincia,
  localidad,
  latitud,
  longitud,
  descripcion,
  creditos_disponibles,
  activo
) VALUES (
  'UUID_CLIENTE_2_AQUI',  -- Reemplazar con UUID real
  'cliente2.demo@agroconnect.ar',
  'María García - Establecimiento El Algarrobo',
  '+54 9 351 456-7890',
  'cliente',
  'Córdoba',
  'Marcos Juárez',
  -32.6978,
  -62.1091,
  'Campo de 300 ha dedicado principalmente a soja y maíz.',
  0,
  true
);

-- USUARIO PRESTADOR 1 (Buenos Aires - Multi-servicio)
-- Email: prestador.demo@agroconnect.ar
-- Password: demo123
INSERT INTO usuarios (
  id,
  email,
  nombre,
  telefono,
  tipo,
  provincia,
  localidad,
  latitud,
  longitud,
  descripcion,
  servicios_ofrecidos,
  creditos_disponibles,
  activo
) VALUES (
  'UUID_PRESTADOR_1_AQUI',  -- Reemplazar con UUID real
  'prestador.demo@agroconnect.ar',
  'AgroServicios del Norte SRL',
  '+54 9 11 5678-9012',
  'prestador',
  'Buenos Aires',
  'Junín',
  -34.5861,
  -60.9456,
  'Empresa con 15 años de experiencia. Flota: 3 pulverizadoras autopropulsadas, 2 sembradoras de siembra directa. Cobertura radio 200km.',
  ARRAY['pulverizacion', 'siembra'],
  15,  -- Créditos demo para testing
  true
);

-- USUARIO PRESTADOR 2 (Córdoba - Cosecha)
-- Email: prestador2.demo@agroconnect.ar
-- Password: demo123
INSERT INTO usuarios (
  id,
  email,
  nombre,
  telefono,
  tipo,
  provincia,
  localidad,
  latitud,
  longitud,
  descripcion,
  servicios_ofrecidos,
  creditos_disponibles,
  activo
) VALUES (
  'UUID_PRESTADOR_2_AQUI',  -- Reemplazar con UUID real
  'prestador2.demo@agroconnect.ar',
  'Cosecha Integral Córdoba',
  '+54 9 351 567-8901',
  'prestador',
  'Córdoba',
  'Bell Ville',
  -32.6262,
  -62.6889,
  'Especialistas en cosecha de gruesa y fina. 4 cosechadoras John Deere última generación.',
  ARRAY['siembra', 'cosecha'],
  8,  -- Créditos demo
  true
);

-- USUARIO PRESTADOR 3 (Santa Fe - Flete)
-- Email: fletero.demo@agroconnect.ar
-- Password: demo123
INSERT INTO usuarios (
  id,
  email,
  nombre,
  telefono,
  tipo,
  provincia,
  localidad,
  latitud,
  longitud,
  descripcion,
  servicios_ofrecidos,
  creditos_disponibles,
  activo
) VALUES (
  'UUID_PRESTADOR_3_AQUI',  -- Reemplazar con UUID real
  'fletero.demo@agroconnect.ar',
  'Transporte Rossi Hnos',
  '+54 9 342 456-7890',
  'prestador',
  'Santa Fe',
  'Rosario',
  -32.9468,
  -60.6393,
  'Transporte de granos con certificación SENASA. Flota de 10 camiones. Servicio puerta a puerto.',
  ARRAY['flete'],
  12,  -- Créditos demo
  true
);

-- SOLICITUDES DEMO (abiertas)
-- Reemplazar UUID_CLIENTE_1_AQUI con el UUID real del cliente 1

-- Solicitud 1: Pulverización en Pergamino
INSERT INTO solicitudes (
  cliente_id,
  tipo_servicio,
  descripcion,
  hectareas,
  fecha_necesaria,
  provincia,
  localidad,
  latitud,
  longitud,
  estado,
  presupuesto_estimado,
  costo_creditos
) VALUES (
  'UUID_CLIENTE_1_AQUI',
  'pulverizacion',
  'Necesito pulverización para control de malezas en lote de soja. Momento óptimo próximos 7 días. Producto a cargo del contratista.',
  150,
  CURRENT_DATE + INTERVAL '7 days',
  'Buenos Aires',
  'Pergamino',
  -33.8897,
  -60.5736,
  'abierta',
  450000,
  5  -- 2 base + 3 por hectáreas
);

-- Solicitud 2: Siembra en Marcos Juárez
INSERT INTO solicitudes (
  cliente_id,
  tipo_servicio,
  descripcion,
  hectareas,
  fecha_necesaria,
  provincia,
  localidad,
  latitud,
  longitud,
  estado,
  presupuesto_estimado,
  costo_creditos
) VALUES (
  'UUID_CLIENTE_2_AQUI',
  'siembra',
  'Siembra directa de soja de primera. Semilla híbrida. Se requiere sembradora con sistema de dosificación de precisión.',
  200,
  CURRENT_DATE + INTERVAL '10 days',
  'Córdoba',
  'Marcos Juárez',
  -32.6978,
  -62.1091,
  'abierta',
  800000,
  8  -- 3 base + 5 por hectáreas
);

-- Solicitud 3: Flete desde Pergamino a Rosario
INSERT INTO solicitudes (
  cliente_id,
  tipo_servicio,
  descripcion,
  toneladas,
  fecha_necesaria,
  provincia,
  localidad,
  latitud,
  longitud,
  estado,
  presupuesto_estimado,
  costo_creditos
) VALUES (
  'UUID_CLIENTE_1_AQUI',
  'flete',
  'Transporte de 500 toneladas de soja desde establecimiento en Pergamino a puerto Rosario. Carga lista a partir del 15 del mes.',
  500,
  CURRENT_DATE + INTERVAL '15 days',
  'Buenos Aires',
  'Pergamino',
  -33.8897,
  -60.5736,
  'abierta',
  300000,
  1  -- Flete tiene costo bajo
);

-- NOTA IMPORTANTE:
-- Para que este script funcione, primero debes:
-- 1. Crear los usuarios manualmente en Supabase Auth (Authentication → Users)
-- 2. Usar los mismos emails de arriba
-- 3. Password sugerido para todos: demo123
-- 4. Copiar los UUIDs generados por Supabase
-- 5. Reemplazar todos los "UUID_XXX_AQUI" con los UUIDs reales
-- 6. Ejecutar este script en el SQL Editor de Supabase
