-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create usuarios table
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'prestador')),
  provincia TEXT NOT NULL,
  localidad TEXT NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  descripcion TEXT,
  servicios_ofrecidos TEXT[],
  creditos_disponibles INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create solicitudes table
CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_servicio TEXT NOT NULL CHECK (tipo_servicio IN ('pulverizacion', 'siembra', 'cosecha', 'flete')),
  descripcion TEXT NOT NULL,
  hectareas DECIMAL(10, 2),
  toneladas DECIMAL(10, 2),
  fecha_necesaria DATE NOT NULL,
  provincia TEXT NOT NULL,
  localidad TEXT NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_proceso', 'completada', 'cancelada')),
  prestador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  presupuesto_estimado DECIMAL(12, 2),
  costo_creditos INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transacciones table
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID REFERENCES solicitudes(id) ON DELETE SET NULL,
  prestador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('compra_creditos', 'uso_creditos', 'pago_canon')),
  monto_ars DECIMAL(12, 2),
  creditos INTEGER NOT NULL,
  porcentaje_canon DECIMAL(5, 2),
  estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'aprobado', 'rechazado')),
  metodo_pago TEXT,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create packs_creditos table
CREATE TABLE IF NOT EXISTS packs_creditos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  cantidad_creditos INTEGER NOT NULL,
  precio_ars DECIMAL(10, 2) NOT NULL,
  descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
  popular BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create configuracion_canon table
CREATE TABLE IF NOT EXISTS configuracion_canon (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_servicio TEXT UNIQUE NOT NULL CHECK (tipo_servicio IN ('pulverizacion', 'siembra', 'cosecha', 'flete')),
  porcentaje_canon DECIMAL(5, 2) NOT NULL,
  creditos_base INTEGER NOT NULL,
  creditos_por_hectarea DECIMAL(5, 2) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_provincia ON usuarios(provincia);
CREATE INDEX idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX idx_solicitudes_tipo_servicio ON solicitudes(tipo_servicio);
CREATE INDEX idx_solicitudes_provincia ON solicitudes(provincia);
CREATE INDEX idx_solicitudes_cliente_id ON solicitudes(cliente_id);
CREATE INDEX idx_solicitudes_prestador_id ON solicitudes(prestador_id);
CREATE INDEX idx_transacciones_prestador_id ON transacciones(prestador_id);
CREATE INDEX idx_transacciones_estado_pago ON transacciones(estado_pago);

-- Enable Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs_creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_canon ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios
CREATE POLICY "Users can view own profile" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON usuarios
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view prestadores profiles" ON usuarios
  FOR SELECT USING (tipo = 'prestador' AND activo = true);

-- RLS Policies for solicitudes
CREATE POLICY "Anyone can view open solicitudes" ON solicitudes
  FOR SELECT USING (estado = 'abierta' OR cliente_id = auth.uid() OR prestador_id = auth.uid());

CREATE POLICY "Clientes can create solicitudes" ON solicitudes
  FOR INSERT WITH CHECK (cliente_id = auth.uid());

CREATE POLICY "Clientes can update own solicitudes" ON solicitudes
  FOR UPDATE USING (cliente_id = auth.uid());

CREATE POLICY "Prestadores can update assigned solicitudes" ON solicitudes
  FOR UPDATE USING (prestador_id = auth.uid());

-- RLS Policies for transacciones
CREATE POLICY "Users can view own transacciones" ON transacciones
  FOR SELECT USING (prestador_id = auth.uid() OR cliente_id = auth.uid());

CREATE POLICY "Prestadores can create transacciones" ON transacciones
  FOR INSERT WITH CHECK (prestador_id = auth.uid());

-- RLS Policies for packs_creditos
CREATE POLICY "Anyone can view active packs" ON packs_creditos
  FOR SELECT USING (activo = true);

-- RLS Policies for configuracion_canon
CREATE POLICY "Anyone can view configuracion_canon" ON configuracion_canon
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_solicitudes_updated_at
  BEFORE UPDATE ON solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
