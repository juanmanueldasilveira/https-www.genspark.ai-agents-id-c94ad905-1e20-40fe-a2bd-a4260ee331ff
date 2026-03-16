export interface Provincia {
  nombre: string
  lat: number
  lng: number
}

export const PROVINCIAS_ARGENTINA: Provincia[] = [
  { nombre: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  { nombre: 'CABA', lat: -34.6037, lng: -58.3816 },
  { nombre: 'Catamarca', lat: -28.4696, lng: -65.7795 },
  { nombre: 'Chaco', lat: -27.4514, lng: -58.9867 },
  { nombre: 'Chubut', lat: -43.2489, lng: -65.3126 },
  { nombre: 'Córdoba', lat: -31.4201, lng: -64.1888 },
  { nombre: 'Corrientes', lat: -27.4692, lng: -58.8306 },
  { nombre: 'Entre Ríos', lat: -31.7333, lng: -60.5297 },
  { nombre: 'Formosa', lat: -26.1775, lng: -58.1781 },
  { nombre: 'Jujuy', lat: -24.1858, lng: -65.2995 },
  { nombre: 'La Pampa', lat: -36.6167, lng: -64.2834 },
  { nombre: 'La Rioja', lat: -29.4131, lng: -66.8558 },
  { nombre: 'Mendoza', lat: -32.8895, lng: -68.8458 },
  { nombre: 'Misiones', lat: -27.3621, lng: -55.9008 },
  { nombre: 'Neuquén', lat: -38.9516, lng: -68.0591 },
  { nombre: 'Río Negro', lat: -40.8135, lng: -62.9967 },
  { nombre: 'Salta', lat: -24.7821, lng: -65.4232 },
  { nombre: 'San Juan', lat: -31.5375, lng: -68.5364 },
  { nombre: 'San Luis', lat: -33.3017, lng: -66.3378 },
  { nombre: 'Santa Cruz', lat: -51.6226, lng: -69.2168 },
  { nombre: 'Santa Fe', lat: -31.6333, lng: -60.7000 },
  { nombre: 'Santiago del Estero', lat: -27.7824, lng: -64.2643 },
  { nombre: 'Tierra del Fuego', lat: -54.8019, lng: -68.3029 },
  { nombre: 'Tucumán', lat: -26.8083, lng: -65.2176 },
]

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Get provincia coordinates by name
 */
export function getProvinciaCoords(nombre: string): { lat: number; lng: number } | null {
  const provincia = PROVINCIAS_ARGENTINA.find(p => p.nombre === nombre)
  return provincia ? { lat: provincia.lat, lng: provincia.lng } : null
}
