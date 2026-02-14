"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function normalizeNoAccents(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // acentos
    .replace(/\s+/g, "")            // espacios
    .replace(/[^a-zA-Z0-9]/g, "");  // símbolos
}

function buildEducadorPassword(nombre: string, apellido: string, fecha_nacimiento: string) {
  const year = fecha_nacimiento.slice(0, 4);
  return `${normalizeNoAccents(nombre)}${normalizeNoAccents(apellido)}${year}`;
}

export async function createEducadorAction(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "").trim(); // YYYY-MM-DD
  const domicilio = String(formData.get("domicilio") ?? "").trim();
  const rama = String(formData.get("rama") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telefono = String(formData.get("telefono") ?? "").trim();

  if (!nombre || !apellido || !dni || !fecha_nacimiento || !domicilio || !rama || !cargo || !email || !telefono) {
    throw new Error("Faltan datos del educador.");
  }

  // Evitar duplicados por DNI
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

  // 2) Insert educador con auth_user_id
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
  });

  if (insErr) throw new Error(insErr.message);

  redirect("/educadores?toast=" + encodeURIComponent("Educador creado."));
}

export async function updateEducadorAction(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const id = Number(formData.get("id"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "").trim();
  const domicilio = String(formData.get("domicilio") ?? "").trim();
  const rama = String(formData.get("rama") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telefono = String(formData.get("telefono") ?? "").trim();

  if (!id) throw new Error("ID inválido.");
  if (!nombre || !apellido || !dni || !fecha_nacimiento || !domicilio || !rama || !cargo || !email || !telefono) {
    throw new Error("Faltan datos del educador.");
  }

  // Traigo el auth_user_id actual para (opcional) sincronizar email en auth
  const { data: edu, error: eduErr } = await supabaseAdmin
    .from("educadores")
    .select("auth_user_id,email")
    .eq("id", id)
    .single();

  if (eduErr) throw new Error(eduErr.message);

  // 1) Update tabla educadores
  const { error: updErr } = await supabaseAdmin
    .from("educadores")
    .update({
      nombre,
      apellido,
      dni: Number(dni),
      fecha_nacimiento,
      domicilio,
      rama,
      cargo,
      email,
      telefono: Number(telefono),
    })
    .eq("id", id);

  if (updErr) throw new Error(updErr.message);

  // 2) Si cambió el email y hay auth_user_id, lo sincronizo también
  const authUserId = edu.auth_user_id as string | null;
  const oldEmail = String(edu.email ?? "").toLowerCase();
  if (authUserId && oldEmail && oldEmail !== email) {
    const { error: authUpdErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId, { email });
    if (authUpdErr) throw new Error(`Se actualizó el educador pero falló auth email: ${authUpdErr.message}`);
  }

  redirect("/educadores?toast=" + encodeURIComponent("Educador actualizado."));
}
