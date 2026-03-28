import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";

type DetalleRow = {
  id: number;
  nombre_producto: string | null;
  precio: number | null;
};

type CompraRow = {
  id: number;
  id_venta_detalle: number;
  comprador_tipo: "protagonista" | "educador" | "grupo";
  id_protagonista: number | null;
  id_educador: number | null;
  cantidad: number;
  pago: boolean;
};

type ProtagonistaRow = {
  id: number;
  nombre: string;
  apellido: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ventaId = Number(url.searchParams.get("venta") ?? "");
  const vista = url.searchParams.get("vista") === "protagonista" ? "protagonista" : "producto";

  if (!Number.isFinite(ventaId) || ventaId <= 0) {
    return NextResponse.json({ error: "venta inválida" }, { status: 400 });
  }

  const supabase = await createSupabaseServerReadOnly();

  const { data: detallesData, error: detallesErr } = await supabase
    .from("ventas_detalle")
    .select("id, nombre_producto, precio")
    .eq("id_ventas_cabecera", ventaId)
    .order("created_at", { ascending: true });

  if (detallesErr) {
    return NextResponse.json({ error: detallesErr.message }, { status: 500 });
  }

  const detalles = (detallesData ?? []) as DetalleRow[];
  const detalleIds = detalles.map((d) => d.id);

  let compras: CompraRow[] = [];
  if (detalleIds.length > 0) {
    const { data: comprasData, error: comprasErr } = await supabase
      .from("ventas_compras")
      .select("id, id_venta_detalle, comprador_tipo, id_protagonista, id_educador, cantidad, pago")
      .in("id_venta_detalle", detalleIds);

    if (comprasErr) {
      return NextResponse.json({ error: comprasErr.message }, { status: 500 });
    }

    compras = (comprasData ?? []) as CompraRow[];
  }

  const preciosByDetalle = new Map<number, { nombre: string; precio: number | null }>();
  detalles.forEach((d) => {
    preciosByDetalle.set(d.id, {
      nombre: d.nombre_producto ?? `Producto #${d.id}`,
      precio: d.precio,
    });
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Resumen");

  let totalVenta = 0;

  if (vista === "producto") {
    sheet.columns = [
      { header: "Producto", key: "producto", width: 30 },
      { header: "Cantidad total", key: "total", width: 18 },
      { header: "Pagado", key: "pagado", width: 15 },
      { header: "Pendiente", key: "pendiente", width: 15 },
      { header: "Precio", key: "precio", width: 15 },
      { header: "Total estimado", key: "importe", width: 18 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const d of detalles) {
      const comprasProd = compras.filter((c) => c.id_venta_detalle === d.id);

      const qtyTotal = comprasProd.reduce((acc, x) => acc + Number(x.cantidad ?? 0), 0);
      const qtyPagada = comprasProd
        .filter((x) => x.pago)
        .reduce((acc, x) => acc + Number(x.cantidad ?? 0), 0);
      const qtyPend = qtyTotal - qtyPagada;

      const precio = d.precio ?? 0;
      const total = precio * qtyTotal;
      totalVenta += total;

      sheet.addRow({
        producto: d.nombre_producto ?? `Producto #${d.id}`,
        total: qtyTotal,
        pagado: qtyPagada,
        pendiente: qtyPend,
        precio,
        importe: total,
      });
    }

    sheet.addRow({});
    const totalRow = sheet.addRow({
      producto: "TOTAL GENERAL",
      importe: totalVenta,
    });

    totalRow.font = { bold: true };
    sheet.getColumn("precio").numFmt = '"$"#,##0.00';
    sheet.getColumn("importe").numFmt = '"$"#,##0.00';
  } else {
    const protagonistaIds = Array.from(
      new Set(
        compras
          .filter((c) => c.comprador_tipo === "protagonista" && c.id_protagonista != null)
          .map((c) => Number(c.id_protagonista))
      )
    );

    const protagonistasById = new Map<number, string>();

    if (protagonistaIds.length > 0) {
      const { data: protasData, error: protasErr } = await supabase
        .from("protagonistas")
        .select("id, nombre, apellido")
        .in("id", protagonistaIds);

      if (protasErr) {
        return NextResponse.json({ error: protasErr.message }, { status: 500 });
      }

      ((protasData ?? []) as ProtagonistaRow[]).forEach((p) => {
        protagonistasById.set(p.id, `${p.apellido}, ${p.nombre}`);
      });
    }

    const agg = new Map<
      number,
      {
        nombre: string;
        cantidadesPorProducto: Record<number, number>;
        totalCantidad: number;
        totalImporte: number;
      }
    >();

    for (const c of compras) {
      if (c.comprador_tipo !== "protagonista" || c.id_protagonista == null) continue;

      const pid = Number(c.id_protagonista);
      const nombre = protagonistasById.get(pid) ?? `Protagonista #${pid}`;
      const precio = preciosByDetalle.get(c.id_venta_detalle)?.precio ?? 0;
      const cantidad = Number(c.cantidad ?? 0);
      const importe = cantidad * Number(precio ?? 0);

      if (!agg.has(pid)) {
        agg.set(pid, {
          nombre,
          cantidadesPorProducto: {},
          totalCantidad: 0,
          totalImporte: 0,
        });
      }

      const row = agg.get(pid)!;
      row.cantidadesPorProducto[c.id_venta_detalle] =
        (row.cantidadesPorProducto[c.id_venta_detalle] ?? 0) + cantidad;
      row.totalCantidad += cantidad;
      row.totalImporte += importe;
    }

    const rows = Array.from(agg.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    );

    sheet.columns = [
      { header: "Protagonista", key: "protagonista", width: 35 },
      ...detalles.map((d) => ({
        header: d.nombre_producto ?? `Producto #${d.id}`,
        key: `prod_${d.id}`,
        width: 16,
      })),
      { header: "Total cant.", key: "totalCantidad", width: 15 },
      { header: "Total $", key: "totalImporte", width: 18 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const r of rows) {
      const rowData: Record<string, string | number> = {
        protagonista: r.nombre,
        totalCantidad: r.totalCantidad,
        totalImporte: r.totalImporte,
      };

      for (const d of detalles) {
        rowData[`prod_${d.id}`] = r.cantidadesPorProducto[d.id] ?? 0;
      }

      totalVenta += r.totalImporte;
      sheet.addRow(rowData);
    }

    sheet.addRow({});
    const totalRow = sheet.addRow({
      protagonista: "TOTAL GENERAL",
      totalImporte: totalVenta,
    });

    totalRow.font = { bold: true };
    sheet.getColumn("totalImporte").numFmt = '"$"#,##0.00';
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="resumen_venta_${ventaId}_${vista}.xlsx"`,
    },
  });
}