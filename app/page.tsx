import Link from 'next/link'
import { Tractor, MapPin, ShieldCheck, Clock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tractor className="w-8 h-8" />
            <span className="text-2xl font-bold">AgroConnect</span>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login" className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/auth/register" className="px-6 py-2 bg-white text-primary-700 hover:bg-gray-100 rounded-lg transition-colors font-semibold">
              Registrarse
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Conectamos el Campo Argentino
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
            La plataforma que une productores con prestadores de servicios agropecuarios en toda Argentina
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/register?tipo=cliente" className="px-8 py-4 bg-white text-primary-700 hover:bg-gray-100 rounded-lg font-bold text-lg transition-colors">
              Soy Productor
            </Link>
            <Link href="/auth/register?tipo=prestador" className="px-8 py-4 bg-primary-500 hover:bg-primary-400 rounded-lg font-bold text-lg transition-colors">
              Ofrezco Servicios
            </Link>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Servicios Disponibles</h2>
          <p className="text-gray-600 text-center mb-12 text-lg">Encontrá o ofrecé servicios en toda Argentina</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Pulverización', icon: '🚜', desc: 'Aplicación de productos fitosanitarios' },
              { name: 'Siembra', icon: '🌱', desc: 'Siembra directa y convencional' },
              { name: 'Cosecha', icon: '🌾', desc: 'Cosecha de granos y oleaginosas' },
              { name: 'Flete', icon: '🚛', desc: 'Transporte de granos y insumos' },
            ].map((service) => (
              <div key={service.name} className="card text-center hover:shadow-lg transition-shadow">
                <div className="text-6xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                <p className="text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">¿Cómo Funciona?</h2>
          <p className="text-gray-600 text-center mb-12 text-lg">Simple y seguro en 4 pasos</p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Registrate', desc: 'Elegí tu perfil: productor o prestador', icon: '👤' },
              { step: 2, title: 'Publicá o Buscá', desc: 'Crea solicitudes o encontrá trabajos cercanos', icon: '📍' },
              { step: 3, title: 'Conectá', desc: 'El prestador toma el trabajo y paga su canon', icon: '🤝' },
              { step: 4, title: 'Trabajá', desc: 'Coordinan y completan el servicio', icon: '✅' },
            ].map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <MapPin className="w-12 h-12 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Geolocalizado</h3>
                <p className="text-gray-600">Encontrá servicios cerca tuyo en las 24 provincias argentinas</p>
              </div>
            </div>
            <div className="flex gap-4">
              <ShieldCheck className="w-12 h-12 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Pago Seguro</h3>
                <p className="text-gray-600">Integración con MercadoPago para transacciones seguras</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="w-12 h-12 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Rápido y Eficiente</h3>
                <p className="text-gray-600">Conectá con prestadores en minutos, no en días</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">¿Listo para empezar?</h2>
          <p className="text-xl mb-8 text-primary-100">Unite a la comunidad agropecuaria más grande de Argentina</p>
          <Link href="/auth/register" className="inline-block px-8 py-4 bg-white text-primary-700 hover:bg-gray-100 rounded-lg font-bold text-lg transition-colors">
            Crear Cuenta Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Tractor className="w-6 h-6" />
            <span className="text-xl font-bold text-white">AgroConnect Argentina</span>
          </div>
          <p className="mb-4">Marketplace de servicios agropecuarios</p>
          <p className="text-sm text-gray-500">© 2024 AgroConnect. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
