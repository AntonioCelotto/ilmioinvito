import { NextResponse } from "next/server";
import { createServerAuthClient, createSupabaseAdminClient } from "@/lib/supabase/server";

const MANAGER_IDS = new Set([
  "c47912c3-0662-4c91-bbfd-16efb7a80780",
  "0a6c17a9-fb23-4ca2-90b3-6ea06c225ac1",
  "b5e351d7-a291-4fee-9c25-d2317e2fc4a6",
  "b40c78db-6e9d-431f-8190-2a7d3561c90d"
]);

const imageBucket = "invitation-location-images";
const videoBucket = "invitation-template-videos";
const publishedPrefix = "admin-gallery";
const hiddenPrefix = "admin-gallery-hidden";
const posterPrefix = "admin-gallery-posters";

type MediaType = "image" | "video";

function encodeMeta(name: string, category: string) {
  return Buffer.from(JSON.stringify({ name, category }), "utf8").toString("base64url");
}

function decodeMeta(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "");
  const split = base.indexOf("__");
  if (split < 0) return null;
  try {
    const meta = JSON.parse(Buffer.from(base.slice(split + 2), "base64url").toString("utf8")) as { name?: string; category?: string };
    return { id: base.slice(0, split), name: meta.name || "Template", category: meta.category || "evento-privato" };
  } catch {
    return null;
  }
}

async function managerFromRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const auth = createServerAuthClient();
  if (!auth) return null;
  const { data } = await auth.auth.getUser(token);
  return data.user && MANAGER_IDS.has(data.user.id) ? data.user : null;
}

async function listPrefix(bucket: string, prefix: string, mediaType: MediaType) {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
  return (data ?? []).flatMap((object) => {
    if (!object.name || object.name === ".emptyFolderPlaceholder") return [];
    const meta = decodeMeta(object.name);
    if (!meta) return [];
    const storagePath = `${prefix}/${object.name}`;
    const url = admin.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    const posterPath = `${posterPrefix}/${meta.id}.jpg`;
    const posterUrl = mediaType === "video" ? admin.storage.from(imageBucket).getPublicUrl(posterPath).data.publicUrl : "";
    return [{
      id: meta.id,
      name: meta.name,
      category: meta.category,
      mediaType,
      imageUrl: mediaType === "image" ? url : posterUrl,
      videoUrl: mediaType === "video" ? url : "",
      posterUrl,
      published: prefix === publishedPrefix,
      storagePath
    }];
  });
}

async function allItems(includeHidden: boolean) {
  const published = await Promise.all([
    listPrefix(imageBucket, publishedPrefix, "image"),
    listPrefix(videoBucket, publishedPrefix, "video")
  ]);
  if (!includeHidden) return published.flat();
  const hidden = await Promise.all([
    listPrefix(imageBucket, hiddenPrefix, "image"),
    listPrefix(videoBucket, hiddenPrefix, "video")
  ]);
  return [...published.flat(), ...hidden.flat()];
}

export async function GET(request: Request) {
  const manager = await managerFromRequest(request);
  const items = await allItems(Boolean(manager));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const manager = await managerFromRequest(request);
  if (!manager) return NextResponse.json({ error: "Accesso amministratore richiesto." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Servizio non configurato." }, { status: 503 });

  const form = await request.formData();
  const file = form.get("file");
  const poster = form.get("poster");
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const category = String(form.get("category") ?? "evento-privato").trim().slice(0, 40);
  if (!(file instanceof File) || !name) return NextResponse.json({ error: "Nome e file sono obbligatori." }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Il file non può superare 50 MB." }, { status: 400 });

  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) return NextResponse.json({ error: "Formato non supportato." }, { status: 400 });

  const mediaType: MediaType = isVideo ? "video" : "image";
  const bucket = isVideo ? videoBucket : imageBucket;
  const id = crypto.randomUUID();
  const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${publishedPrefix}/${id}__${encodeMeta(name, category)}.${ext}`;

  const { error } = await admin.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isVideo && poster instanceof File) {
    const posterPath = `${posterPrefix}/${id}.jpg`;
    const { error: posterError } = await admin.storage.from(imageBucket).upload(posterPath, poster, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: true
    });
    if (posterError) {
      await admin.storage.from(bucket).remove([path]);
      return NextResponse.json({ error: posterError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ created: true, id });
}

export async function PATCH(request: Request) {
  const manager = await managerFromRequest(request);
  if (!manager) return NextResponse.json({ error: "Accesso amministratore richiesto." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Servizio non configurato." }, { status: 503 });
  const body = await request.json() as { id?: string; mediaType?: MediaType; published?: boolean };
  if (!body.id || (body.mediaType !== "image" && body.mediaType !== "video")) return NextResponse.json({ error: "Template non valido." }, { status: 400 });

  const bucket = body.mediaType === "video" ? videoBucket : imageBucket;
  const fromPrefix = body.published ? hiddenPrefix : publishedPrefix;
  const toPrefix = body.published ? publishedPrefix : hiddenPrefix;
  const { data } = await admin.storage.from(bucket).list(fromPrefix, { limit: 200 });
  const object = (data ?? []).find((item) => item.name.startsWith(`${body.id}__`));
  if (!object) return NextResponse.json({ error: "Template non trovato." }, { status: 404 });
  const { error } = await admin.storage.from(bucket).move(`${fromPrefix}/${object.name}`, `${toPrefix}/${object.name}`);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(request: Request) {
  const manager = await managerFromRequest(request);
  if (!manager) return NextResponse.json({ error: "Accesso amministratore richiesto." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Servizio non configurato." }, { status: 503 });
  const body = await request.json() as { id?: string; mediaType?: MediaType };
  if (!body.id || (body.mediaType !== "image" && body.mediaType !== "video")) return NextResponse.json({ error: "Template non valido." }, { status: 400 });

  const bucket = body.mediaType === "video" ? videoBucket : imageBucket;
  for (const prefix of [publishedPrefix, hiddenPrefix]) {
    const { data } = await admin.storage.from(bucket).list(prefix, { limit: 200 });
    const object = (data ?? []).find((item) => item.name.startsWith(`${body.id}__`));
    if (object) await admin.storage.from(bucket).remove([`${prefix}/${object.name}`]);
  }
  if (body.mediaType === "video") await admin.storage.from(imageBucket).remove([`${posterPrefix}/${body.id}.jpg`]);
  return NextResponse.json({ deleted: true });
}
