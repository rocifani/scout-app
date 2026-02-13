"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = createSupabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) setMsg(error.message);
    else window.location.href = "/";
  }

  async function signUp() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) setMsg(error.message);
    else setMsg("Cuenta creada. Ahora iniciá sesión.");
  }

  return (
    // Si querés forzar dark mode como Windmill: <div className="dark">
    <div className="">
      <div className="flex items-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800">
          <div className="flex flex-col overflow-y-auto md:flex-row">
            {/* Left image */}
          <div className="flex items-center justify-center p-6 md:w-1/2 bg-white dark:bg-gray-900">
            <img
              aria-hidden="true"
              className="w-56 sm:w-64 md:w-72 lg:w-80 h-auto object-contain"
              src="/assets/img/login-logo.jpg"
              alt="Logo"
            />
          </div>


            {/* Right form */}
            <div className="flex items-center justify-center p-6 sm:p-12 md:w-1/2">
              <div className="w-full">
                <h1 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200">
                  Iniciar sesión
                </h1>

                <form onSubmit={signIn}>
                  <label className="block text-sm">
                    <span className="text-gray-700 dark:text-gray-400">Mail</span>
                    <input
                      className="block w-full mt-1 text-sm dark:border-gray-600 dark:bg-gray-700
                                 focus:border-[#FCDB52] focus:ring-2 focus:ring-[#FCDB52]/40 focus:outline-none
                                 dark:text-gray-300 form-input"
                      placeholder="mi_mail@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </label>

                  <label className="block mt-4 text-sm">
                    <span className="text-gray-700 dark:text-gray-400">Contraseña</span>
                    <input
                      className="block w-full mt-1 text-sm dark:border-gray-600 dark:bg-gray-700
                                 focus:border-[#FCDB52] focus:ring-2 focus:ring-[#FCDB52]/40 focus:outline-none
                                 dark:text-gray-300 form-input"
                      placeholder="***************"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="block w-full px-4 py-2 mt-4 text-sm font-medium leading-5 text-center
                               text-gray-900 transition-colors duration-150 bg-[#FCDB52]
                               border border-transparent rounded-lg
                               hover:bg-[#F3D146] active:bg-[#E9C83D]
                               focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40
                               disabled:opacity-60"
                  >
                    {loading ? "Entrando..." : "Iniciar sesión"}
                  </button>
                </form>

                <hr className="my-8" />

              

                {msg && (
                  <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                    {msg}
                  </p>
                )}

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Nota: para iniciar sesión, tenés que utilizar el mail que proporcionaste a los educadores al inicio de actividades. Como contraseña, colocá el DNI de tu hijo/a.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
