"use client";
import { useEffect, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { operatorRequest } from "@/lib/operators/client";
import type { InvitationTheme } from "@/lib/draft-storage";
import { fontMaxBytes, normalizeCustomFont, type InvitationCustomFont } from "@/lib/fonts/shared";

type Props = { theme: InvitationTheme; onChange: (patch: Partial<InvitationTheme>) => void };
export function OperatorFontEditor({ theme, onChange }: Props) {
  const [fonts,setFonts] = useState<InvitationCustomFont[]>([]);
  const [file,setFile] = useState<File | null>(null);
  const [name,setName] = useState("");
  const [licensed,setLicensed] = useState(false);
  const [message,setMessage] = useState("");
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [fileKey,setFileKey] = useState(0);
  useEffect(() => {
    let active = true;
    void operatorRequest<{fonts:InvitationCustomFont[]}>("/api/operators/fonts").then(result=>{
      if(active) setFonts(result.fonts.map(normalizeCustomFont).filter((font):font is InvitationCustomFont=>Boolean(font)));
    }).catch(error=>{if(active) setMessage(error.message);}).finally(()=>{if(active) setLoading(false);});
    return ()=>{active=false;};
  },[]);
  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen=event.target.files?.[0]??null;
    setFile(chosen); setMessage("");
    if(chosen) setName(chosen.name.replace(/\.[^.]+$/,"").slice(0,80));
  }
  async function upload() {
    if(!file || !licensed || !name.trim()) {setMessage("Scegli il file, inserisci il nome e conferma la licenza web.");return;}
    if(file.size>fontMaxBytes){setMessage("Il font non può superare 2 MB.");return;}
    setBusy(true);setMessage("");
    try {
      // Ask the browser's font decoder to validate the actual font before upload.
      await new FontFace("InvitationUploadCheck",await file.arrayBuffer()).load();
      const client=createClient();
      const {data}=client ? await client.auth.getSession() : {data:{session:null}};
      if(!data.session) throw new Error("Accedi nuovamente prima di caricare il font.");
      const body=new FormData();body.set("file",file);body.set("name",name.trim());body.set("licensed","true");
      const response=await fetch("/api/operators/fonts",{method:"POST",headers:{Authorization:`Bearer ${data.session.access_token}`},body});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error??"Caricamento non riuscito.");
      const font=normalizeCustomFont(result.font);
      if(!font) throw new Error("Il font caricato non è valido.");
      setFonts(current=>[font,...current]);setFile(null);setName("");setLicensed(false);setFileKey(current=>current+1);
      setMessage("Font caricato. Sceglilo per titoli o testi, poi salva la bozza.");
    }catch(error){setMessage(error instanceof Error?error.message:"Il browser non riesce a leggere questo font. Prova la versione WOFF2.");}
    finally{setBusy(false);}
  }
  const selectedHeading=normalizeCustomFont(theme.customHeadingFont);
  const selectedBody=normalizeCustomFont(theme.customBodyFont);
  const options=[...fonts];
  for(const font of [selectedHeading,selectedBody]) if(font&&!options.some(item=>item.id===font.id)) options.push(font);
  return <section className="operator-font-editor" aria-label="Font personali operatore">
    <p className="eyebrow">Esclusivo operatori</p><h3>I tuoi font personali</h3>
    <p>Coordina titoli e testi con la grafica del cliente. I font caricati rimangono nel tuo account e puoi riutilizzarli nei tuoi inviti.</p>
    <div className="field-row">
      <label className="field">Font dei titoli<select aria-label="Font personale dei titoli" disabled={loading} value={selectedHeading?.id??""} onChange={event=>onChange({customHeadingFont:options.find(font=>font.id===event.target.value)})}><option value="">Usa lo stile standard</option>{options.map(font=><option value={font.id} key={font.id}>{font.name}</option>)}</select></label>
      <label className="field">Font dei testi<select aria-label="Font personale dei testi" disabled={loading} value={selectedBody?.id??""} onChange={event=>onChange({customBodyFont:options.find(font=>font.id===event.target.value)})}><option value="">Usa lo stile standard</option>{options.map(font=><option value={font.id} key={font.id}>{font.name}</option>)}</select></label>
    </div>
    {selectedHeading||selectedBody ? <button className="button light" type="button" onClick={()=>onChange({customHeadingFont:undefined,customBodyFont:undefined})}>Ripristina font standard</button>:null}
    <details><summary>Carica un nuovo font</summary>
      <label className="field">File del font<input key={fileKey} type="file" accept=".woff2,.woff,.ttf,.otf" disabled={busy} onChange={selectFile}/></label>
      <p className="muted">WOFF2 consigliato. Accettiamo anche WOFF, TTF e OTF, fino a 2 MB per file. Puoi conservare fino a 30 font.</p>
      <label className="field">Nome da mostrare<input value={name} maxLength={80} disabled={busy} onChange={event=>setName(event.target.value)} placeholder="Es. Elegante Regular"/></label>
      <label className="check-row"><input type="checkbox" checked={licensed} disabled={busy} onChange={event=>setLicensed(event.target.checked)}/><span>Confermo di avere una licenza che permette l’incorporamento di questo font negli inviti pubblicati sul web.</span></label>
      <p className="muted">L’elenco dei font è personale. Il file del font usato nell’invito sarà scaricato dal browser degli invitati per visualizzarlo.</p>
      <button className="button" type="button" disabled={busy||!file||!licensed||!name.trim()} onClick={()=>void upload()}>{busy?"Caricamento…":"Carica font"}</button>
    </details>
    {message?<p className="panel-note" role="status">{message}</p>:null}
  </section>;
}
