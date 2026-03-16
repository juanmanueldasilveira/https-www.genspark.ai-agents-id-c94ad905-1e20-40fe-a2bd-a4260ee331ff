"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type UsuarioTipo = "cliente" | "prestador" | "admin";
type UsuarioRow = { tipo: UsuarioTipo | null };

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1) Sign in with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Credenciales inválidas");

      // 2) Get user profile to determine tipo
      // ✅ FIX (Opción A): casteo del builder + guard, para evitar `never`
      const { data: usuarioData, error: profileError } = await (
        supabase.from("usuarios") as any
      )
        .select("tipo")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const usuario = usuarioData as UsuarioRow | null;

      // Guard: si no existe perfil o no tiene tipo, mandamos a completar registro
      if (!usuario?.tipo) {
        router.push("/auth/register");
        return;
      }

      // 3) Redirect to appropriate dashboard
      router.push(
        usuario.tipo === "cliente"
          ? "/dashboard/cliente"
          : "/dashboard/prestador"
      );
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Iniciar Sesión</h1>
          <p className="text-gray-600">Bienvenido de vuelta</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                required
                className="input"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            ¿No tenés cuenta?{" "}
            <Link
              href="/auth/register"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Registrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
