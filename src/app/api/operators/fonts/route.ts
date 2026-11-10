import { NextResponse } from "next/server";
import { operatorContext, noStore } from "@/lib/operators/server";
import { isProjectAdmin } from "@/lib/admin-role";
import { allowRequest } from "@/lib/rate-limit";
import { fontBucket, fontMaxBytes, customFontPath } from "@/lib/fonts/shared";
import { validateFontFile, fontMime } from "@/lib/fonts/validation";

export async function GET(request: Request) {
  const ctx = await operatorContext(request);
  if (ctx.response) return ctx.response;
  const { data, error } = await ctx.db.from("operator_fonts").select("id,owner_id,name,format").eq("owner_id",ctx.user.id).order("created_at",{ascending:false});
  if (error) return NextResponse.json({ error: "Impossibile caricare i tuoi font." },{status:500});
  return NextResponse.json({ fonts: data.map(row => ({ id:row.id,ownerId:row.owner_id,name:row.name,format:row.format })) },noStore);
}
export async function POST(request: Request) {
  const ctx = await operatorContext(request);
  if (ctx.response) return ctx.response;
  if (!isProjectAdmin(ctx.user)) {
    const { data, error } = await ctx.db.from("operator_accounts").select("status").eq("user_id",ctx.user.id).maybeSingle();
    if (error || data?.status !== "active") return NextResponse.json({error:"Il caricamento dei font è riservato agli operatori abilitati."},{status:403});
  }
  if (!allowRequest(`operator-font:${ctx.user.id}`,10,10*60_000)) return NextResponse.json({error:"Troppi caricamenti. Attendi qualche minuto."},{status:429});
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > fontMaxBytes + 16384) return NextResponse.json({error:"Il font non può superare 2 MB."},{status:413});
  try {
    const form = await request.formData();
    const file = form.get("file");
    const name = form.get("name");
    if (!(file instanceof File) || typeof name !== "string" || !name.trim() || name.trim().length > 80 || /[\u0000-\u001f\u007f]/.test(name) || form.get("licensed") !== "true") return NextResponse.json({error:"Inserisci il nome del font e conferma di avere una licenza che consenta l’incorporamento sul web."},{status:400});
    if (file.size > fontMaxBytes) return NextResponse.json({error:"Il font non può superare 2 MB."},{status:413});
    const buffer = new Uint8Array(await file.arrayBuffer());
    const format = validateFontFile(buffer,file.name);
    const { count, error: countError } = await ctx.db.from("operator_fonts").select("id",{count:"exact",head:true}).eq("owner_id",ctx.user.id);
    if (countError) throw new Error("Verifica dei font non riuscita.");
    if ((count ?? 0) >= 30) return NextResponse.json({error:"Hai raggiunto il limite di 30 font personali."},{status:409});
    const font = { id:crypto.randomUUID(),ownerId:ctx.user.id,name:name.trim(),format };
    const path = customFontPath(font);
    const { error: uploadError } = await ctx.db.storage.from(fontBucket).upload(path,buffer,{contentType:fontMime[format],upsert:false,cacheControl:"31536000"});
    if (uploadError) throw new Error("Caricamento font non riuscito.");
    const { error: rowError } = await ctx.db.from("operator_fonts").insert({id:font.id,owner_id:font.ownerId,name:font.name,format,storage_path:path,file_size:file.size,license_confirmed_at:new Date().toISOString()});
    if (rowError) {
      await ctx.db.storage.from(fontBucket).remove([path]);
      throw new Error("Registrazione font non riuscita. Riprova.");
    }
    return NextResponse.json({font},noStore);
  } catch (error) { return NextResponse.json({error:error instanceof Error ? error.message : "Caricamento non riuscito."},{status:400}); }
}
