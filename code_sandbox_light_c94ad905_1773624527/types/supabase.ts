export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nombre: string
          telefono: string | null
          tipo: 'cliente' | 'prestador'
          provincia: string
          localidad: string
          latitud: number
          longitud: number
          descripcion: string | null
          servicios_ofrecidos: string[] | null
          creditos_disponibles: number
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nombre: string
          telefono?: string | null
          tipo: 'cliente' | 'prestador'
          provincia: string
          localidad: string
          latitud: number
          longitud: number
          descripcion?: string | null
          servicios_ofrecidos?: string[] | null
          creditos_disponibles?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nombre?: string
          telefono?: string | null
          tipo?: 'cliente' | 'prestador'
          provincia?: string
          localidad?: string
          latitud?: number
          longitud?: number
          descripcion?: string | null
          servicios_ofrecidos?: string[] | null
          creditos_disponibles?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      solicitudes: {
        Row: {
          id: string
          cliente_id: string
          tipo_servicio: 'pulverizacion' | 'siembra' | 'cosecha' | 'flete'
          descripcion: string
          hectareas: number | null
          toneladas: number | null
          fecha_necesaria: string
          provincia: string
          localidad: string
          latitud: number
          longitud: number
          estado: 'abierta' | 'en_proceso' | 'completada' | 'cancelada'
          prestador_id: string | null
          presupuesto_estimado: number | null
          costo_creditos: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          tipo_servicio: 'pulverizacion' | 'siembra' | 'cosecha' | 'flete'
          descripcion: string
          hectareas?: number | null
          toneladas?: number | null
          fecha_necesaria: string
          provincia: string
          localidad: string
          latitud: number
          longitud: number
          estado?: 'abierta' | 'en_proceso' | 'completada' | 'cancelada'
          prestador_id?: string | null
          presupuesto_estimado?: number | null
          costo_creditos: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          tipo_servicio?: 'pulverizacion' | 'siembra' | 'cosecha' | 'flete'
          descripcion?: string
          hectareas?: number | null
          toneladas?: number | null
          fecha_necesaria?: string
          provincia?: string
          localidad?: string
          latitud?: number
          longitud?: number
          estado?: 'abierta' | 'en_proceso' | 'completada' | 'cancelada'
          prestador_id?: string | null
          presupuesto_estimado?: number | null
          costo_creditos?: number
          created_at?: string
          updated_at?: string
        }
      }
      transacciones: {
        Row: {
          id: string
          solicitud_id: string | null
          prestador_id: string
          cliente_id: string | null
          tipo: 'compra_creditos' | 'uso_creditos' | 'pago_canon'
          monto_ars: number | null
          creditos: number
          porcentaje_canon: number | null
          estado_pago: 'pendiente' | 'aprobado' | 'rechazado'
          metodo_pago: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          solicitud_id?: string | null
          prestador_id: string
          cliente_id?: string | null
          tipo: 'compra_creditos' | 'uso_creditos' | 'pago_canon'
          monto_ars?: number | null
          creditos: number
          porcentaje_canon?: number | null
          estado_pago?: 'pendiente' | 'aprobado' | 'rechazado'
          metodo_pago?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          solicitud_id?: string | null
          prestador_id?: string
          cliente_id?: string | null
          tipo?: 'compra_creditos' | 'uso_creditos' | 'pago_canon'
          monto_ars?: number | null
          creditos?: number
          porcentaje_canon?: number | null
          estado_pago?: 'pendiente' | 'aprobado' | 'rechazado'
          metodo_pago?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          created_at?: string
        }
      }
      packs_creditos: {
        Row: {
          id: string
          nombre: string
          cantidad_creditos: number
          precio_ars: number
          descuento_porcentaje: number
          popular: boolean
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          cantidad_creditos: number
          precio_ars: number
          descuento_porcentaje?: number
          popular?: boolean
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          cantidad_creditos?: number
          precio_ars?: number
          descuento_porcentaje?: number
          popular?: boolean
          activo?: boolean
          created_at?: string
        }
      }
      configuracion_canon: {
        Row: {
          id: string
          tipo_servicio: 'pulverizacion' | 'siembra' | 'cosecha' | 'flete'
          porcentaje_canon: number
          creditos_base: number
          creditos_por_hectarea: number
          descripcion: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tipo_servicio: 'pulverizacion' | 'siembra' | 'cosecha' | 'flete'
          porcentaje_canon: number
          creditos_base: number
          creditos_por_hectarea: number
          descripcion?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tipo_servicio?: 'pulverizacion' | 'siembra' | 'cosecha' | 'flete'
          porcentaje_canon?: number
          creditos_base?: number
          creditos_por_hectarea?: number
          descripcion?: string | null
          created_at?: string
        }
      }
    }
  }
}
