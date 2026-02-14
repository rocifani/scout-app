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

export async function createProtagonistaConPadres(formData: FormData) {
  const supabase = await createSupabaseServer();
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

  // 2) Por cada padre: crear/actualizar en tabla padres + crear usuario auth + relacion
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

    // Buscar si ya existe el padre por DNI (ideal: poner UNIQUE(dni) en padres)
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

      // Opcional: actualizar datos de contacto por si cambiaron
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

    // Crear usuario auth si no está asociado
    if (!authUserId) {
      // ⚠️ Contraseña = DNI del protagonista (como pediste). Recomendación: forzar cambio luego.
      const { data: created, error: createUserErr } = await supabaseAdmin.auth.admin.createUser({
        email: pEmail,
        password: dniProta,
        email_confirm: true, // si querés que ya quede confirmado
      });

      if (createUserErr) {
            // Si el email ya existe, no frenamos el flujo.
            // (Después, si querés, hacemos el link con auth_user_id)
            const msg = (createUserErr.message || "").toLowerCase();
            if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
                // seguimos sin setear authUserId
            } else {
                throw new Error(`Error creando usuario para ${pEmail}: ${createUserErr.message}`);
            }
            } else {
            authUserId = created.user.id;

            const { error: padreAuthUpdErr } = await supabaseAdmin
                .from("padres")
                .update({ auth_user_id: authUserId })
                .eq("id", idPadre);

            if (padreAuthUpdErr) throw new Error(padreAuthUpdErr.message);
            }


      if (!created?.user?.id) {
        throw new Error("No se pudo obtener el ID del usuario creado.");
        }

        authUserId = created.user.id;


      // Guardar auth_user_id en tabla padres
      const { error: padreAuthUpdErr } = await supabaseAdmin
        .from("padres")
        .update({ auth_user_id: authUserId })
        .eq("id", idPadre);

      if (padreAuthUpdErr) throw new Error(padreAuthUpdErr.message);
    }

    // Insertar relación padre-protagonista (ideal: UNIQUE(id_protagonista,id_padre))
    const { error: relErr } = await supabaseAdmin.from("padres_protagonistas").insert({
      id_protagonista: idProtagonista,
      id_padre: idPadre,
      relacion: pRelacion,
    });

    if (relErr) throw new Error(relErr.message);
  }

    // 3) Generar cuotas del año actual (Abr-Dic + afiliación) para este protagonista
  const anio = new Date().getFullYear();

  const { error: cuotasErr } = await supabaseAdmin.rpc("generar_cuotas_para_protagonista", {
    p_protagonista_id: idProtagonista,
    p_anio: anio,
  });

  if (cuotasErr) throw new Error(cuotasErr.message);

  redirect("/protagonistas");
}
