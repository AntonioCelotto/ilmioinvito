"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createFinalVideoFrameFile } from "@/lib/video-frame";

type Item = {
  id: string;
  name: string;
  category: string;
  mediaType: "image" | "video";
  imageUrl: string;
  videoUrl: string;
  posterUrl: string;
  published: boolean;
};

const categories = [
  ["matrimonio","Matrimonio"],
  ["compleanno","Compleanno"],
  ["battesimo","Battesimo"],
  ["comunione","Comunione"],
  ["laurea","Laurea"],
  ["evento-privato","Evento privato"],
  ["evento-aziendale","Evento aziendale"]
];

async function authToken() {
  const supabase = createClient();
  const { data } = await supabase!.auth.getSession();
  return data.session?.access_token ?? "";
}

export function TemplateAdminClient() {
  const [items,setItems]=useState<Item[]>([]);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [allowed,setAllowed]=useState<boolean|null>(null);

  async function refresh() {
    const token=await authToken();
    if(!token){setAllowed(false);return;}
    const response=await fetch("/api/template-library",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
    if(!response.ok){setAllowed(false);return;}
    const data=await response.json() as {items:Item[]};
    setItems(data.items);setAllowed(true);
  }

  useEffect(()=>{void refresh();},[]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form=event.currentTarget;
    const data=new FormData(form);
    const file=data.get("file");
    if(!(file instanceof File)||!file.size){setMessage("Scegli prima un file.");return;}
    setBusy(true);setMessage("Caricamento in corso...");
    if(file.type.startsWith("video/")){
      try{data.set("poster",await createFinalVideoFrameFile(file));}catch{}
    }
    const token=await authToken();
    const response=await fetch("/api/template-library",{method:"POST",headers:{Authorization:`Bearer ${token}`},body:data});
    const result=await response.json().catch(()=>({})) as {error?:string};
    if(response.ok){form.reset();setMessage("Template pubblicato nella galleria.");await refresh();}
    else setMessage(result.error||"Caricamento non riuscito.");
    setBusy(false);
  }

  async function toggle(item:Item) {
    const token=await authToken();setBusy(true);
    const response=await fetch("/api/template-library",{method:"PATCH",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({id:item.id,mediaType:item.mediaType,published:!item.published})});
    setMessage(response.ok?(item.published?"Template nascosto.":"Template pubblicato."):"Aggiornamento non riuscito.");
    await refresh();setBusy(false);
  }

  async function remove(item:Item) {
    if(!window.confirm(`Eliminare definitivamente “${item.name}”?`))return;
    const token=await authToken();setBusy(true);
    const response=await fetch("/api/template-library",{method:"DELETE",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({id:item.id,mediaType:item.mediaType})});
    setMessage(response.ok?"Template eliminato.":"Eliminazione non riuscita.");
    await refresh();setBusy(false);
  }

  if(allowed===null)return <section className="panel"><p>Verifica accesso...</p></section>;
  if(allowed===false)return <section className="panel"><h1>Gestione Template</h1><p>Questa sezione è riservata agli amministratori.</p></section>;

  return <div>
    <section className="panel">
      <p className="eyebrow">Amministrazione</p>
      <h1>Gestione Template</h1>
      <p className="muted">Carica immagini e video: quando sono pubblicati compaiono automaticamente nella galleria Template di ilmioinvito.com.</p>
      <form onSubmit={submit} style={{display:"grid",gap:12,maxWidth:720,marginTop:20}}>
        <label>Nome template<input name="name" required placeholder="Es. Festa elegante" /></label>
        <label>Categoria<select name="category" defaultValue="evento-privato">{categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label>Immagine o video<input name="file" type="file" required accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mov" /></label>
        <small>Immagini JPG/PNG/WebP oppure video MP4/WebM/MOV, massimo 50 MB. Per i video viene creata automaticamente l’anteprima.</small>
        <button className="button" disabled={busy} type="submit">{busy?"Caricamento...":"Pubblica template"}</button>
      </form>
      {message?<p className="panel-note" role="status">{message}</p>:null}
    </section>

    <section className="panel" style={{marginTop:18}}>
      <div className="panel-header"><div><p className="eyebrow">Libreria</p><h2>Template caricati</h2></div><strong>{items.length}</strong></div>
      {items.length===0?<div className="empty-state"><h3>Nessun template amministrativo</h3><p className="muted">Il primo che caricherai comparirà qui.</p></div>:
      <div className="template-grid">
        {items.map(item=><article className="template-card" key={item.id}>
          <div className="template-card-preview" style={{backgroundImage:item.imageUrl?`url("${item.imageUrl}")`:undefined,backgroundPosition:"center",backgroundSize:"cover"}}>
            {item.mediaType==="video"?<video src={item.videoUrl} poster={item.posterUrl||undefined} muted loop playsInline controls style={{width:"100%",height:"100%",objectFit:"cover"}}/>:null}
          </div>
          <div className="template-card-body">
            <div><h3>{item.name}</h3><p>{categories.find(([v])=>v===item.category)?.[1]||item.category}</p><span className={`status ${item.published?"confirmed":"pending"}`}>{item.published?"Pubblicato":"Nascosto"}</span></div>
            <div className="draft-actions" style={{marginTop:12}}>
              <button className="button secondary" disabled={busy} type="button" onClick={()=>void toggle(item)}>{item.published?"Nascondi":"Pubblica"}</button>
              <button className="draft-delete-button" disabled={busy} type="button" onClick={()=>void remove(item)}>Elimina</button>
            </div>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}
