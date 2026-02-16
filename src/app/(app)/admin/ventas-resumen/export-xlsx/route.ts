import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createSupabaseServerReadOnly } from "@/lib/supabase/server-readonly";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ventaId = Number(url.searchParams.get("venta") ?? "");

  if (!Number.isFinite(ventaId) || ventaId <= 0) {
    return NextResponse.json({ error: "venta inválida" }, { status: 400 });
  }

  const supabase = await createSupabaseServerReadOnly();

  const { data, error } = await supabase
    .from("ventas_detalle")
    .select("id, nombre_producto, precio, ventas_compras(cantidad, pago)")
    .eq("id_ventas_cabecera", ventaId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Resumen");

  // Encabezados
  sheet.columns = [
    { header: "Producto", key: "producto", width: 30 },
    { header: "Cantidad total", key: "total", width: 18 },
    { header: "Pagado", key: "pagado", width: 15 },
    { header: "Pendiente", key: "pendiente", width: 15 },
    { header: "Precio", key: "precio", width: 15 },
    { header: "Total estimado", key: "importe", width: 18 },
  ];

  sheet.getRow(1).font = { bold: true };

  let totalVenta = 0;

  (data ?? []).forEach((d: any) => {
    const compras = d.ventas_compras ?? [];
    const qtyTotal = compras.reduce((acc: number, x: any) => acc + Number(x.cantidad ?? 0), 0);
    const qtyPagada = compras.filter((x: any) => x.pago).reduce((acc: number, x: any) => acc + Number(x.cantidad ?? 0), 0);
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
  });

  // Fila total general
  sheet.addRow({});
  const totalRow = sheet.addRow({
    producto: "TOTAL GENERAL",
    importe: totalVenta,
  });

  totalRow.font = { bold: true };

  // Formato moneda
  sheet.getColumn("precio").numFmt = '"$"#,##0.00';
  sheet.getColumn("importe").numFmt = '"$"#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="resumen_venta_${ventaId}.xlsx"`,
    },
  });
}
