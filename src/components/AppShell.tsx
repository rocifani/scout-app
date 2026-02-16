"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { usePathname } from "next/navigation";

type Role = "educador" | "padre";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

function IconHome() {
  return (
    <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2 7-7 7 7 2 2M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H2v-2a4 4 0 014-4h1m8-4a4 4 0 10-8 0 4 4 0 008 0zm6 4a3 3 0 10-6 0 3 3 0 006 0z"
      />
    </svg>
  );
}

function IconReport() {
  return (
    <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6M9 8h6M7 4h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
      />
    </svg>
  );
}

function IconMoney() {
  return (
    <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m2-6h-6m6 0a2 2 0 012 2v2a2 2 0 01-2 2h-6m6-6V9a2 2 0 00-2-2h-1"
      />
    </svg>
  );
}

function IconTent() {
  return (
    <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20l9-16 9 16M6 20h12M10 20v-6h4v6" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
    </svg>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseBrowser();
  const pathname = usePathname();

  const [sideOpen, setSideOpen] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState<string>("");

  const [dark, setDark] = useState(false);

  // ✅ Cierra el sidebar móvil automáticamente cuando cambia la ruta
  useEffect(() => {
    setSideOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: edu, error: eduErr } = await supabase
        .from("educadores")
        .select("nombre, apellido, email")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (eduErr) console.error("educadores:", eduErr);

      if (edu) {
        setRole("educador");
        setFullName(`${edu.nombre} ${edu.apellido}`.trim() || edu.email || user.email || "");
        return;
      }

      const { data: padre, error: padreErr } = await supabase
        .from("padres")
        .select("nombre, apellido, email")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (padreErr) console.error("padres:", padreErr);

      if (padre) {
        setRole("padre");
        setFullName(`${padre.nombre} ${padre.apellido}`.trim() || padre.email || user.email || "");
        return;
      }

      setRole(null);
      setFullName(user.email ?? "");
    }

    load();
  }, [supabase]);

  const navItems: NavItem[] = useMemo(() => {
    const common: NavItem[] = [{ label: "Inicio", href: "/", icon: <IconHome /> }];

    if (role === "educador") {
      return [
        ...common,
        { label: "Protagonistas", href: "/protagonistas", icon: <IconUsers /> },
        { label: "Pagos de cuotas", href: "/admin/cuotas", icon: <IconMoney /> },
        { label: "Autorizaciones entregadas", href: "/admin/autorizaciones-protagonistas", icon: <IconDoc /> },
        { label: "Cargar ventas", href: "/admin/ventas-compras", icon: <IconMoney /> },
        { label: "Resumen de ventas", href: "/admin/ventas-resumen", icon: <IconReport /> },
        { label: "Crear nueva venta", href: "/admin/ventas", icon: <IconMoney /> },
        { label: "Fondo campamento final", href: "/admin/fondo-campamento-final", icon: <IconMoney /> },
        { label: "Educadores", href: "/educadores", icon: <IconUsers /> },
        { label: "Inventario de carpas", href: "/admin/carpas", icon: <IconTent /> },
        { label: "Cursos", href: "/admin/cursos", icon: <IconBook /> },
        { label: "Cursos de educadores", href: "/admin/cursos-educadores", icon: <IconBook /> },
        { label: "Valores de cuotas", href: "/admin/valores", icon: <IconMoney /> },
        { label: "Listado de autorizaciones", href: "/admin/autorizaciones", icon: <IconDoc /> },
      ];
    }

    if (role === "padre") {
      return [
        ...common,
        { label: "Perfil de mi hijo/a", href: "/padres/mi-hijo", icon: <IconUsers /> },
        { label: "Detalle de cuotas", href: "/padres/mis-cuotas", icon: <IconMoney /> },
        { label: "Detalle de autorizaciones", href: "/padres/mis-autorizaciones", icon: <IconDoc /> },
        { label: "Mis ventas", href: "/padres/mis-ventas", icon: <IconMoney /> },
      ];
    }

    return common;
  }, [role]);

  const appName = "⚜️ GS Pablo Apóstol App";

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Backdrop móvil */}
        {sideOpen && <div onClick={() => setSideOpen(false)} className="fixed inset-0 z-10 bg-black/50 md:hidden" />}

        {/* Sidebar desktop */}
        <aside className={["z-20 w-64 overflow-y-auto bg-white dark:bg-gray-800 shrink-0", "hidden md:block"].join(" ")}>
          <Sidebar appName={appName} navItems={navItems} onNavigate={() => setSideOpen(false)} />
        </aside>

        {/* Sidebar móvil */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-20 w-64 mt-16 overflow-y-auto bg-white dark:bg-gray-800 md:hidden",
            "transition-transform duration-150",
            sideOpen ? "translate-x-0" : "-translate-x-72",
          ].join(" ")}
        >
          <Sidebar appName={appName} navItems={navItems} onNavigate={() => setSideOpen(false)} />
        </aside>

        {/* Main */}
        <div className="flex flex-col flex-1 w-full min-w-0">
          {/* Header */}
          <header className="z-10 py-4 bg-white shadow-md dark:bg-gray-800">
            <div className="container flex items-center justify-between h-full px-6 mx-auto text-gray-700 dark:text-gray-200">
              {/* Hamburger (móvil) */}
              <button
                className="p-1 mr-5 -ml-1 rounded-md md:hidden focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/40"
                onClick={() => setSideOpen((v) => !v)}
                aria-label="Menu"
              >
                <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* placeholder */}
              <div className="flex justify-center flex-1 lg:mr-32">
                <div className="relative w-full max-w-xl mr-6">
                  <div className="absolute inset-y-0 flex items-center pl-2 text-gray-500"></div>
                </div>
              </div>

              {/* Acciones derecha */}
              <ul className="flex items-center shrink-0 space-x-4">
                <li className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{fullName || "Cargando..."}</span>
                  </div>

                  <form action="/logout" method="post">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-gray-200
                                dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500
                                focus:outline-none focus:ring-2 focus:ring-[#FCDB52]/30"
                      title="Salir"
                    >
                      <IconLogout />
                      <span className="hidden sm:inline">Salir</span>
                    </button>
                  </form>
                </li>
              </ul>
            </div>
          </header>

          {/* Content */}
          <main className="h-full overflow-y-auto">
            <div className="container px-6 mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  appName,
  navItems,
  onNavigate,
}: {
  appName: string;
  navItems: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname || "/";

  return (
    <div className="py-4 text-gray-500 dark:text-gray-400">
      <Link className="ml-6 text-lg font-bold text-gray-800 dark:text-gray-200" href="/" onClick={onNavigate}>
        {appName}
      </Link>

      <ul className="mt-6">
        {navItems.map((item) => {
          const isActive = active === item.href;

          return (
            <li key={item.href} className="relative px-6 py-3">
              {isActive && (
                <span className="absolute inset-y-0 left-0 w-1 bg-[#FCDB52] rounded-tr-lg rounded-br-lg" aria-hidden="true" />
              )}

              <Link
                href={item.href}
                onClick={onNavigate}
                className={[
                  "inline-flex items-center w-full text-sm font-semibold transition-colors duration-150",
                  "hover:text-gray-800 dark:hover:text-gray-200",
                  isActive ? "text-gray-900 dark:text-gray-100" : "",
                ].join(" ")}
              >
                {item.icon}
                <span className="ml-4">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
