'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Oportunidad = {
  id: string;
  tipo_servicio: string | null;
  provincia: string | null;
  localidad: string | null;
  fecha_necesaria: string | null;
  hectareas: number | null;
  toneladas: number | null;
  presupuesto: number | null;
  descripcion: string | null;
  estado: string | null;
  created_at: string | null;
};

type RosarioItem = {
  producto: string;
  pesos: string | null;
  dolares: string | null;
};

type RosarioResp = {
  ok: boolean;
  dateText?: string;
  timeText?: string;
  tcBnaComprador?: string;
  items?: RosarioItem[];
  error?: string;
};

type Divisa = {
  nombre: string;
  compra: number | null;
  venta: number | null;
  fechaActualizacion?: string;
};

type NoticiasItem = {
  title: string;
  link: string;
  pubDate?: string;
  source?: string;
};

function truncate160(text: string) {
  const t = text.trim();
  if (t.length <= 160) return t;
  return t.slice(0, 157).trimEnd() + '...';
}

function formatMoneyARS(value: number) {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$ ${Math.round(value).toLocaleString('es-AR')}`;
  }
}

function formatDateShort(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function Home() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [sessionReady, setSessionReady] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const [loadingOpp, setLoadingOpp] = useState(true);
  const [loadingRosario, setLoadingRosario] = useState(true);
  const [loadingFx, setLoadingFx] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  const [opp, setOpp] = useState<Oportunidad[]>([]);
  const [rosario, setRosario] = useState<RosarioResp | null>(null);
  const [fx, setFx] = useState<Divisa[]>([]);
  const [news, setNews] = useState<NoticiasItem[]>([]);

  const [errOpp, setErrOpp] = useState<string | null>(null);
  const [errRosario, setErrRosario] = useState<string | null>(null);
  const [errFx, setErrFx] = useState<string | null>(null);
  const [errNews, setErrNews] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setIsLogged(!!data.session);
      } catch {
        // Si falla, la Home igual funciona.
      } finally {
        if (mounted) setSessionReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingOpp(true);
        setErrOpp(null);
        const res = await fetch('/api/public/oportunidades', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setOpp(Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (!mounted) return;
        setErrOpp('No se pudieron cargar oportunidades.');
      } finally {
        if (mounted) setLoadingOpp(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingRosario(true);
        setErrRosario(null);
        const res = await fetch('/api/public/rosario', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setRosario(json);
      } catch (e: any) {
        if (!mounted) return;
        setErrRosario('No se pudieron cargar cotizaciones Rosario.');
      } finally {
        if (mounted) setLoadingRosario(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingFx(true);
        setErrFx(null);
        const res = await fetch('/api/public/divisas', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setFx(Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (!mounted) return;
        setErrFx('No se pudieron cargar divisas.');
      } finally {
        if (mounted) setLoadingFx(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingNews(true);
        setErrNews(null);
        const res = await fetch('/api/public/noticias', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setNews(Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (!mounted) return;
        setErrNews('No se pudieron cargar noticias.');
      } finally {
        if (mounted) setLoadingNews(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const fxTicker = useMemo(() => {
    if (!fx?.length) return 'Divisas: cargando…';
    // Ejemplo: "USD Oficial 1020/1040 • USD Blue 1200/1230 • ..."
    return fx
      .slice(0, 10)
      .map((d) => {
        const compra = d.compra == null ? '—' : d.compra.toLocaleString('es-AR');
        const venta = d.venta == null ? '—' : d.venta.toLocaleString('es-AR');
        return `${d.nombre} ${compra}/${venta}`;
      })
      .join('  •  ');
  }, [fx]);

  const handleVerTomar = (o: Oportunidad) => {
    // Mantiene el “paso a paso”: si no hay sesión, login.
    if (!isLogged) {
      router.push('/auth/login?redirect=/');
      return;
    }
    // Si está logueado, lo mandamos al dashboard (podés cambiar a /oportunidades/[id] cuando exista)
    router.push('/dashboard/prestador');
  };

  return (
    <div className="relative min-h-screen text-slate-100">
      {/* Background image + dark overlays */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-wheat.jpg')" }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/70 via-slate-950/85 to-slate-950" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.16),transparent_55%)]" />

      {/* Top FX ticker (single, loop, more transparent) */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-9 items-center overflow-hidden">
            <div className="mr-3 hidden shrink-0 items-center gap-2 text-[11px] text-white/80 sm:flex">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
              <span className="uppercase tracking-wider">Divisas</span>
            </div>

            <div className="relative w-full overflow-hidden">
              <div className="ticker-mask">
                {/* Duplicamos el contenido para loop continuo */}
                <div className="ticker-track">
                  <span className="ticker-item">{fxTicker}</span>
                  <span className="ticker-sep">•</span>
                  <span className="ticker-item">{fxTicker}</span>
                  <span className="ticker-sep">•</span>
                  <span className="ticker-item">{fxTicker}</span>
                </div>
              </div>
            </div>

            <div className="ml-3 hidden shrink-0 text-[11px] text-white/60 sm:block">
              {loadingFx ? 'Actualizando…' : errFx ? 'Sin datos' : 'Loop'}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="mx-auto max-w-7xl px-4 pt-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">AgroConnect</h1>
              <span className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-xs text-white/70">
                Portal
              </span>
            </div>
            <p className="mt-1 text-sm text-white/70">
              Oportunidades al centro. Mercados y contexto al costado. Accedé a detalles registrándote.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="hidden items-center gap-4 text-sm text-white/70 md:flex">
              <a className="hover:text-white" href="#oportunidades">Oportunidades</a>
              <a className="hover:text-white" href="#mercados">Mercados</a>
              <a className="hover:text-white" href="#noticias">Noticias</a>
            </nav>

            <div className="h-6 w-px bg-white/10 hidden md:block" />

            {sessionReady && !isLogged ? (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                >
                  Ingresar
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400"
                >
                  Registrarse
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400"
              >
                Ir al Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Body 3 columns */}
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left sidebar (glass - more transparency) */}
          <aside id="mercados" className="lg:col-span-3">
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white/90">Mercado de Granos</h2>
                  <span className="text-[11px] text-white/60">Rosario</span>
                </div>

                <div className="mt-3">
                  {loadingRosario ? (
                    <p className="text-sm text-white/60">Cargando cotizaciones…</p>
                  ) : errRosario ? (
                    <p className="text-sm text-rose-200/90">{errRosario}</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/60">
                        <span>{rosario?.dateText ?? ''}</span>
                        <span className="text-white/30">•</span>
                        <span>{rosario?.timeText ?? ''}</span>
                        {rosario?.tcBnaComprador ? (
                          <>
                            <span className="text-white/30">•</span>
                            <span>TC BNA: {rosario.tcBnaComprador}</span>
                          </>
                        ) : null}
                      </div>

                      <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-black/20 text-[11px] uppercase tracking-wider text-white/65">
                            <tr>
                              <th className="px-3 py-2">Producto</th>
                              <th className="px-3 py-2">$/tn</th>
                              <th className="px-3 py-2">US$/tn</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10 bg-white/5">
                            {(rosario?.items ?? []).slice(0, 8).map((it, idx) => (
                              <tr key={`${it.producto}-${idx}`} className="hover:bg-white/8">
                                <td className="px-3 py-2 text-white/85">{it.producto}</td>
                                <td className="px-3 py-2 text-white/75">{it.pesos ?? '—'}</td>
                                <td className="px-3 py-2 text-white/75">{it.dolares ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 text-[11px] text-white/55">
                        Fuente: Precios de pizarra (CAC/BCR)
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/90">Chicago (CME)</h3>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] text-white/65">
                    Delayed
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/70">
                  Cotizaciones con demora (delayed). Para ver al momento, ingresá al sitio oficial.
                </p>
                <a
                  href="https://www.cmegroup.com/market-data/browse-data/delayed-quotes.html"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  Ver en CME
                </a>
                <div className="mt-2 text-[11px] text-white/55">
                  Fuente: CME Delayed Quotes
                </div>
              </div>
            </div>
          </aside>

          {/* Center column (focus) */}
          <section id="oportunidades" className="lg:col-span-6">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Oportunidades</h2>
                  <p className="mt-1 text-sm text-white/70">
                    Explorá el flujo de trabajos disponibles. Para ver detalles y tomar una oportunidad, iniciá sesión.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/register"
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400"
                  >
                    Publicar / Registrarme
                  </Link>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {loadingOpp ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                    Cargando oportunidades…
                  </div>
                ) : errOpp ? (
                  <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                    {errOpp}
                  </div>
                ) : opp.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                    Todavía no hay oportunidades abiertas.
                  </div>
                ) : (
                  opp.slice(0, 20).map((o) => (
                    <div
                      key={o.id}
                      className="group rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-2xl transition hover:bg-white/10"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/20">
                              {o.tipo_servicio ?? 'Servicio'}
                            </span>
                            <span className="text-xs text-white/60">
                              {o.localidad ?? '—'}, {o.provincia ?? '—'}
                            </span>
                            {o.estado ? (
                              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] text-white/65">
                                {o.estado}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
                            {o.fecha_necesaria ? (
                              <span>
                                <span className="text-white/55">Fecha:</span> {formatDateShort(o.fecha_necesaria)}
                              </span>
                            ) : null}
                            {o.hectareas != null ? (
                              <span>
                                <span className="text-white/55">Has:</span> {o.hectareas}
                              </span>
                            ) : null}
                            {o.toneladas != null ? (
                              <span>
                                <span className="text-white/55">Tn:</span> {o.toneladas}
                              </span>
                            ) : null}
                            {o.presupuesto != null ? (
                              <span>
                                <span className="text-white/55">Presupuesto:</span> {formatMoneyARS(o.presupuesto)}
                              </span>
                            ) : null}
                          </div>

                          {o.descripcion ? (
                            <p className="mt-2 text-sm text-white/70">
                              {truncate160(o.descripcion)}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => handleVerTomar(o)}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400"
                          >
                            Ver / Tomar
                          </button>
                        </div>
                      </div>

                      {!isLogged ? (
                        <div className="mt-3 text-[11px] text-white/55">
                          Para acceder a la oportunidad completa, necesitás iniciar sesión.
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Right sidebar (glass - more transparency) */}
          <aside id="noticias" className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white/90">Noticias Agro</h2>
                <span className="text-[11px] text-white/60">Resumen</span>
              </div>

              <div className="mt-3 space-y-3">
                {loadingNews ? (
                  <p className="text-sm text-white/60">Cargando noticias…</p>
                ) : errNews ? (
                  <p className="text-sm text-rose-200/90">{errNews}</p>
                ) : news.length === 0 ? (
                  <p className="text-sm text-white/60">No hay noticias para mostrar.</p>
                ) : (
                  news.slice(0, 10).map((n, idx) => (
                    <a
                      key={`${n.link}-${idx}`}
                      href={n.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-white/10 bg-black/20 p-3 hover:bg-white/8"
                    >
                      <div className="text-sm font-medium text-white/85">{truncate160(n.title)}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                        {n.source ? <span>{n.source}</span> : null}
                        {n.pubDate ? (
                          <>
                            <span className="text-white/30">•</span>
                            <span>{formatDateShort(n.pubDate)}</span>
                          </>
                        ) : null}
                      </div>
                    </a>
                  ))
                )}
              </div>

              <div className="mt-3 text-[11px] text-white/55">
                Fuente: RSS (según endpoint público)
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Global styles for ticker loop */}
      <style jsx global>{`
        /* Mask to soften edges */
        .ticker-mask {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .ticker-track {
          display: inline-flex;
          gap: 14px;
          white-space: nowrap;
          will-change: transform;
          animation: marquee 22s linear infinite;
          color: rgba(255, 255, 255, 0.85);
          font-size: 12px;
        }

        .ticker-item {
          opacity: 0.92;
        }

        .ticker-sep {
          opacity: 0.4;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ticker-track {
            animation: none;
          }
        }

        /* Tailwind doesn't include bg-white/7 by default; works because it's arbitrary via JIT
           If your setup doesn't allow it, change bg-white/7 -> bg-white/10 everywhere. */
      `}</style>
    </div>
  );
}
