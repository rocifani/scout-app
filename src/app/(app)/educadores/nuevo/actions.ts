// ✅ Archivo 2: src/app/(app)/educadores/nuevo/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // SOLO server
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function normalizeNoAccents(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // acentos
    .replace(/\s+/g, "")            // espacios
    .replace(/[^a-zA-Z0-9]/g, "");  // símbolos
}

function buildEducadorPassword(
  nombre: string,
  apellido: string,
  fecha_nacimiento: string
) {
  const year = fecha_nacimiento.slice(0, 4);

  const n = normalizeNoAccents(nombre).toLowerCase();
  const a = normalizeNoAccents(apellido).toLowerCase();

  return `${n}${a}${year}`;
}

export async function createEducadorAction(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "").trim();
  const domicilio = String(formData.get("domicilio") ?? "").trim();
  const rama = String(formData.get("rama") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telefono = String(formData.get("telefono") ?? "").trim();

  if (!nombre || !apellido || !dni || !fecha_nacimiento || !domicilio || !rama || !cargo || !email || !telefono) {
    throw new Error("Faltan datos del educador.");
  }

  // Evitar duplicados por DNI (recomendado: UNIQUE(dni))
  const { data: existente, error: selErr } = await supabaseAdmin
    .from("educadores")
    .select("id")
    .eq("dni", Number(dni))
    .maybeSingle();

  if (selErr) throw new Error(selErr.message);
  if (existente?.id) throw new Error("Ya existe un educador con ese DNI.");

  // 1) Crear usuario auth
  const password = buildEducadorPassword(nombre, apellido, fecha_nacimiento);

  const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr) throw new Error(`Error creando usuario auth: ${authErr.message}`);

  const authUserId = created.user?.id;
  if (!authUserId) throw new Error("No se pudo obtener el ID del usuario creado.");

  // 2) Insert educador con auth_user_id + activo true
  const { error: insErr } = await supabaseAdmin.from("educadores").insert({
    nombre,
    apellido,
    dni: Number(dni),
    fecha_nacimiento,
    domicilio,
    rama,
    cargo,
    email,
    telefono: Number(telefono),
    auth_user_id: authUserId,
    activo: true,
  });

  if (insErr) throw new Error(insErr.message);

  redirect("/educadores?toast=" + encodeURIComponent("Educador creado."));
}
