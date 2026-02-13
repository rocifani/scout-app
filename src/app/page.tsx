import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main style={{ padding: 16 }}>
        <p>No estás logueada.</p>
        <Link href="/login">Ir a login</Link>
      </main>
    );
  }

  // Detectar rol preguntando si existe en educadores/padres por auth_user_id
  const [{ data: edu }, { data: padre }] = await Promise.all([
    supabase.from("educadores").select("id,nombre,apellido").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("padres").select("id,nombre,apellido").eq("auth_user_id", user.id).maybeSingle(),
  ]);

  const role = edu ? "educador" : padre ? "padre" : "desconocido";

  // Esto es la prueba de fuego: RLS decide qué filas volvés a ver.
  const { data: protagonistas, error } = await supabase
    .from("protagonistas")
    .select("id,nombre,apellido,rama,activo,fecha_nacimiento")
    .order("apellido", { ascending: true });

  return (
    <main style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Scout App</h1>
          <p>
            Logueada como: <b>{user.email}</b> — rol: <b>{role}</b>
          </p>
        </div>
        <form action="/logout" method="post">
          <button style={{ padding: 10 }}>Salir</button>
        </form>
      </header>

      <h2 style={{ marginTop: 24 }}>Protagonistas</h2>

      {error && (
        <pre style={{ background: "#fee", padding: 12, overflowX: "auto" }}>
          {error.message}
        </pre>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {(protagonistas ?? []).map((p) => (
          <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <b>{p.apellido}, {p.nombre}</b>
            <div>Rama: {String(p.rama)}</div>
            <div>Activo: {p.activo ? "Sí" : "No"}</div>
            <div>Fecha nac: {p.fecha_nacimiento}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 16, opacity: 0.7 }}>
        Nota: si estás como padre, deberías ver solo tus protagonistas (si RLS está bien).
      </p>
    </main>
  );
}
