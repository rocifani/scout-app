"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

type PadrePayload = {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  relacion?: string;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // SOLO server
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// -------------------------
// Helpers AUTH
// -------------------------
async function getAuthUserIdByEmail(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, email: string) {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Error listando usuarios auth: ${error.message}`);

    const users = data?.users ?? [];
    const found = users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (found?.id) return found.id;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function getOrCreateAuthUserIdByEmail(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  email: string,
  password: string
) {
  const normalized = email.trim().toLowerCase();

  // 1) Si ya existe en Auth, devolvemos ese id
  const existingId = await getAuthUserIdByEmail(supabaseAdmin, normalized);
  if (existingId) return existingId;

  // 2) Si no existe, lo creamos
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
  });

  if (createErr) {
    // Race condition: si alguien lo creó justo antes, buscamos de nuevo
    const msg = (createErr.message || "").toLowerCase();
    const isDup =
      msg.includes("already") || msg.includes("registered") || msg.includes("exists") || msg.includes("duplicate");

    if (isDup) {
      const id = await getAuthUserIdByEmail(supabaseAdmin, normalized);
      if (id) return id;
    }

    throw new Error(`Error creando usuario para ${normalized}: ${createErr.message}`);
  }

  const newId = created?.user?.id;
  if (!newId) throw new Error(`No se pudo obtener el ID del usuario creado (${normalized}).`);

  return newId;
}

// -------------------------
// ACTION
// -------------------------
export async function createProtagonistaConPadres(formData: FormData) {
  const supabase = await createSupabaseServer(); // (si no lo usás, lo podés borrar)
  const supabaseAdmin = getSupabaseAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const rama = String(formData.get("rama") ?? "").trim();
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "").trim();
  const dniProta = String(formData.get("dni") ?? "").trim();
  const domicilio = String(formData.get("domicilio") ?? "").trim();

  const padresJson = String(formData.get("padres_json") ?? "[]");
  let padres: PadrePayload[] = [];
  try {
    padres = JSON.parse(padresJson);
  } catch {
    throw new Error("Padres inválidos.");
  }

  if (!nombre || !apellido || !rama || !fecha_nacimiento || !dniProta || !domicilio) {
    throw new Error("Faltan datos del protagonista.");
  }

  if (!Array.isArray(padres) || padres.length < 1) {
    throw new Error("Tenés que cargar al menos 1 padre/tutor.");
  }

  // 1) Crear protagonista
  const { data: protaInserted, error: protaErr } = await supabaseAdmin
    .from("protagonistas")
    .insert({
      nombre,
      apellido,
      rama,
      fecha_nacimiento,
      dni: Number(dniProta),
      domicilio,
      activo: true,
    })
    .select("id")
    .single();

  if (protaErr) throw new Error(protaErr.message);
  const idProtagonista = protaInserted.id as number;

  // 2) Padres
  for (const padre of padres) {
    const pNombre = String(padre.nombre ?? "").trim();
    const pApellido = String(padre.apellido ?? "").trim();
    const pDni = String(padre.dni ?? "").trim();
    const pTelefono = String(padre.telefono ?? "").trim();
    const pEmail = String(padre.email ?? "").trim().toLowerCase();
    const pRelacion = String(padre.relacion ?? "Padre/Madre").trim();

    if (!pNombre || !pApellido || !pDni || !pTelefono || !pEmail) {
      throw new Error("Faltan datos en alguno de los padres/tutores.");
    }

    // Buscar padre por DNI
    const { data: padreExistente, error: padreSelErr } = await supabaseAdmin
      .from("padres")
      .select("id, auth_user_id")
      .eq("dni", Number(pDni))
      .maybeSingle();

    if (padreSelErr) throw new Error(padreSelErr.message);

    let idPadre: number;
    let authUserId: string | null = padreExistente?.auth_user_id ?? null;

    if (!padreExistente) {
      // Insert padre
      const { data: padreIns, error: padreInsErr } = await supabaseAdmin
        .from("padres")
        .insert({
          nombre: pNombre,
          apellido: pApellido,
          telefono: Number(pTelefono),
          email: pEmail,
          dni: Number(pDni),
          auth_user_id: null,
        })
        .select("id")
        .single();

      if (padreInsErr) throw new Error(padreInsErr.message);
      idPadre = padreIns.id as number;
    } else {
      idPadre = padreExistente.id as number;

      // Actualizar datos de contacto
      const { error: padreUpdErr } = await supabaseAdmin
        .from("padres")
        .update({
          nombre: pNombre,
          apellido: pApellido,
          telefono: Number(pTelefono),
          email: pEmail,
        })
        .eq("id", idPadre);

      if (padreUpdErr) throw new Error(padreUpdErr.message);
    }

    // ✅ Acá está la magia: si no tiene auth_user_id, lo buscamos/creamos por email
    if (!authUserId) {
      // Password = DNI del padre
      authUserId = await getOrCreateAuthUserIdByEmail(supabaseAdmin, pEmail, pDni);

      const { error: padreAuthUpdErr } = await supabaseAdmin
        .from("padres")
        .update({ auth_user_id: authUserId })
        .eq("id", idPadre);

      if (padreAuthUpdErr) throw new Error(padreAuthUpdErr.message);
    }

    // Relación padre-protagonista
    const { error: relErr } = await supabaseAdmin.from("padres_protagonistas").insert({
      id_protagonista: idProtagonista,
      id_padre: idPadre,
      relacion: pRelacion,
    });

    if (relErr) throw new Error(relErr.message);
  }

  // 3) Cuotas año actual
  const anio = new Date().getFullYear();

  const { error: cuotasErr } = await supabaseAdmin.rpc("generar_cuotas_para_protagonista", {
    p_protagonista_id: idProtagonista,
    p_anio: anio,
  });
  if (cuotasErr) throw new Error(cuotasErr.message);

  // 4) Autorizaciones año actual
  const { data: auts, error: autSelErr } = await supabaseAdmin
    .from("autorizaciones")
    .select("id")
    .eq("activo", true);

  if (autSelErr) throw new Error(autSelErr.message);

  const toInsert = (auts ?? []).map((a) => ({
    id_protagonista: idProtagonista,
    id_autorizacion: a.id,
    anio_vigencia: anio,
    entregada: false,
  }));

  if (toInsert.length > 0) {
    const { error: autInsErr } = await supabaseAdmin.from("autorizaciones_protagonistas").insert(toInsert);
    if (autInsErr) throw new Error(autInsErr.message);
  }

  redirect("/protagonistas");
}
