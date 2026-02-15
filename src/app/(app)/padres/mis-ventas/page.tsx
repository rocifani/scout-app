import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

type VentaCabecera = { id: number; nombre_venta: string | null };

type VentaDetalle = {
  id: number;
  id_ventas_cabecera: number | null;
  nombre_producto: string | null;
  ganancia_individual: number | null;
};

type Linea = {
  id: number;
  id_protagonista: number;
  id_venta_detalle: number;
  cantidad: number;
  created_at: string;
};

function money(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function formatARDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR");
}

export default async function MisVentasPage() {
  const supabase = await createSupabaseServer();

  // 1) user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2) padre
  const { data: padre, error: padreErr } = await supabase
    .from("padres")
    .select("id,nombre,apellido,email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (padreErr) return <div className="p-6 text-red-600">Error: {padreErr.message}</div>;

  if (!padre) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Volver
          </Link>
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Mis ventas</h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Tu usuario no está vinculado a un padre/tutor en el sistema.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 3) hijos: ids de protagonistas
  const { data: rels, error: relErr } = await supabase
    .from("padres_protagonistas")
    .select("id_protagonista")
    .eq("id_padre", padre.id);

  if (relErr) return <div className="p-6 text-red-600">Error: {relErr.message}</div>;

  const protaIds = (rels ?? []).map((r: any) => Number(r.id_protagonista)).filter(Boolean);

  if (protaIds.length === 0) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl space-y-4">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Mis ventas</h1>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 text-sm text-gray-600 dark:text-gray-300">
            No tenés protagonistas vinculados todavía.
          </div>
        </div>
      </main>
    );
  }

  // 3.b) Transferencias al Fondo Campamento Final (de todos sus hijos)
  const { data: fondosRaw, error: fondosErr } = await supabase
    .from("fondo_campamento_final")
    .select("monto")
    .in("id_protagonista", protaIds);

  if (fondosErr) return <div className="p-6 text-red-600">Error fondo: {fondosErr.message}</div>;

  const totalTransferencias = (fondosRaw ?? []).reduce((acc: number, r: any) => {
    const m = Number(r.monto ?? 0);
    return acc + (Number.isFinite(m) ? m : 0);
  }, 0);

  // 4) líneas de ventas de SUS hijos
  const { data: linesRaw, error: lErr } = await supabase
    .from("ventas_protagonistas")
    .select("id, id_protagonista, id_venta_detalle, cantidad, created_at")
    .in("id_protagonista", protaIds)
    .order("created_at", { ascending: false });

  if (lErr) return <div className="p-6 text-red-600">Error ventas: {lErr.message}</div>;

  const lines: Linea[] = (linesRaw ?? []).map((ln: any) => ({
    id: Number(ln.id),
    id_protagonista: Number(ln.id_protagonista),
    id_venta_detalle: Number(ln.id_venta_detalle),
    cantidad: Number(ln.cantidad),
    created_at: String(ln.created_at),
  }));

  if (lines.length === 0) {
    // Si no hay ventas, igual mostramos transferencias + total
    const totalGeneralSinVentas = totalTransferencias;

    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl space-y-6">
          <div>
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← Volver
            </Link>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-2">Mis ventas</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {padre.apellido}, {padre.nombre} · {padre.email}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <div className="text-sm text-gray-600 dark:text-gray-300">Ganancia por ventas</div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">${money(0)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Suma de ganancia individual (todos tus hijos)
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <div className="text-sm text-gray-600 dark:text-gray-300">Aportes al fondo</div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                ${money(totalTransferencias)}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <div className="text-sm text-gray-600 dark:text-gray-300">Total acumulado</div>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                ${money(totalGeneralSinVentas)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ventas + transferencias (todos tus hijos)
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 text-sm text-gray-600 dark:text-gray-300">
            Todavía no hay ventas cargadas para tus protagonistas.
          </div>
        </div>
      </main>
    );
  }

  // 5) traer detalles (para ganancia_individual) + cabeceras (nombre_venta)
  const detalleIds = Array.from(new Set(lines.map((x) => x.id_venta_detalle)));

  const { data: detsRaw, error: dErr } = await supabase
    .from("ventas_detalle")
    .select("id, id_ventas_cabecera, nombre_producto, ganancia_individual")
    .in("id", detalleIds);

  if (dErr) return <div className="p-6 text-red-600">Error productos: {dErr.message}</div>;

  const dets: VentaDetalle[] = (detsRaw ?? []).map((d: any) => ({
    id: Number(d.id),
    id_ventas_cabecera: d.id_ventas_cabecera == null ? null : Number(d.id_ventas_cabecera),
    nombre_producto: d.nombre_producto ?? null,
    ganancia_individual: d.ganancia_individual == null ? null : Number(d.ganancia_individual),
  }));

  const cabeceraIds = Array.from(
    new Set(dets.map((d) => d.id_ventas_cabecera).filter((x): x is number => typeof x === "number"))
  );

  const { data: cabsRaw, error: cErr } = cabeceraIds.length
    ? await supabase.from("ventas_cabecera").select("id, nombre_venta").in("id", cabeceraIds)
    : { data: [], error: null };

  if (cErr) return <div className="p-6 text-red-600">Error ventas: {cErr.message}</div>;

  const cabs: VentaCabecera[] = (cabsRaw ?? []).map((c: any) => ({
    id: Number(c.id),
    nombre_venta: c.nombre_venta ?? null,
  }));

  const detById = new Map<number, VentaDetalle>(dets.map((d) => [d.id, d]));
  const cabById = new Map<number, VentaCabecera>(cabs.map((c) => [c.id, c]));

  // 6) armar resumen por venta y producto
  type Row = {
    venta_id: number | null;
    venta_nombre: string;
    producto_id: number;
    producto_nombre: string;
    cantidad: number;
    ganancia_ind: number; // por unidad
    total_ganancia: number;
    last_at: string; // última fecha
  };

  const agg = new Map<string, Row>();
  let totalGananciaVentas = 0;

  for (const ln of lines) {
    const det = detById.get(ln.id_venta_detalle);
    if (!det) continue;

    const gan = det.ganancia_individual ?? 0;
    const total = ln.cantidad * gan;

    const ventaId = det.id_ventas_cabecera ?? null;
    const ventaNombre = ventaId ? cabById.get(ventaId)?.nombre_venta ?? `Venta #${ventaId}` : "Venta";
    const prodNombre = det.nombre_producto ?? `Producto #${det.id}`;

    totalGananciaVentas += total;

    const key = `${ventaId ?? "null"}::${det.id}`;
    const prev = agg.get(key);

    if (!prev) {
      agg.set(key, {
        venta_id: ventaId,
        venta_nombre: ventaNombre,
        producto_id: det.id,
        producto_nombre: prodNombre,
        cantidad: ln.cantidad,
        ganancia_ind: gan,
        total_ganancia: total,
        last_at: ln.created_at,
      });
    } else {
      prev.cantidad += ln.cantidad;
      prev.total_ganancia += total;
      if (new Date(ln.created_at) > new Date(prev.last_at)) prev.last_at = ln.created_at;
      agg.set(key, prev);
    }
  }

  const totalGeneral = totalGananciaVentas + totalTransferencias;

  const rows = Array.from(agg.values()).sort((a, b) => {
    const va = a.venta_nombre.localeCompare(b.venta_nombre);
    if (va !== 0) return va;
    return a.producto_nombre.localeCompare(b.producto_nombre);
  });

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl space-y-6">
        <div>
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mt-2">Mis ventas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {padre.apellido}, {padre.nombre} · {padre.email}
          </p>
        </div>

        {/* TOTALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="text-sm text-gray-600 dark:text-gray-300">Ganancia por ventas</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
              ${money(totalGananciaVentas)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Suma de ganancia individual (todos tus hijos)
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="text-sm text-gray-600 dark:text-gray-300">Transferencias al fondo</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
              ${money(totalTransferencias)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pagos realizados por ustedes al fondo
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="text-sm text-gray-600 dark:text-gray-300">Total acumulado</div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              ${money(totalGeneral)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ventas + transferencias (todos tus hijos)
            </div>
          </div>
        </div>

        {/* Tabla resumen */}
        <div className="w-full overflow-hidden rounded-lg shadow">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead>
                <tr
                  className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b
                             dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                >
                  <th className="px-4 py-3">Venta</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Ganancia ind.</th>
                  <th className="px-4 py-3">Total ganancia</th>
                  <th className="px-4 py-3">Últ. carga</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {rows.map((r) => (
                  <tr key={`${r.venta_id ?? "null"}-${r.producto_id}`} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3 font-semibold">{r.venta_nombre}</td>
                    <td className="px-4 py-3">{r.producto_nombre}</td>
                    <td className="px-4 py-3">{r.cantidad}</td>
                    <td className="px-4 py-3">${money(r.ganancia_ind)}</td>
                    <td className="px-4 py-3 font-semibold">${money(r.total_ganancia)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {formatARDateTime(r.last_at)}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                      No hay ventas para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            className="px-4 py-3 text-xs text-gray-500 uppercase border-t
                       dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
          >
            Items: {rows.length}
          </div>
        </div>
       
      </div>
    </main>
  );
}
