"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createFinalVideoFrameFile } from "@/lib/video-frame";

type Item = {
  id: string;
  source: "legacy" | "custom";
  name: string;
  category: string;
  mediaType: "image" | "video";
  imageUrl: string;
  videoUrl: string;
  posterUrl: string;
  published: boolean;
  order: number;
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
    setItems([...data.items].sort((a,b)=>a.order-b.order));
    setAllowed(true);
  }

  useEffect(()=>{void refresh();},[]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form=event.currentTarget;
    const data=new FormData(form);
    const file=data.get("file");
    const name=String(data.get("name")??"").trim();
    const category=String(data.get("category")??"evento-privato");
    if(!(file instanceof File)||!file.size){setMessage("Scegli prima un file.");return;}

    const supabase=createClient();
    if(!supabase){setMessage("Supabase non è configurato.");return;}
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setMessage("Sessione amministratore non valida.");return;}

    setBusy(true);
    setMessage("Caricamento in corso...");

    const isVideo=file.type.startsWith("video/");
    const bucket=isVideo?"invitation-template-videos":"invitation-location-images";
    const ext=(file.name.split(".").pop()|| (isVideo?"mp4":"jpg")).toLowerCase().replace(/[^a-z0-9]/g,"");
    const uploadId=crypto.randomUUID();
    const tempPath=`${user.id}/admin-upload/${uploadId}.${ext}`;

    const upload=await supabase.storage.from(bucket).upload(tempPath,file,{
      contentType:file.type,
      cacheControl:"3600",
      upsert:false
    });

    if(upload.error){
      setMessage(`Caricamento non riuscito: ${upload.error.message}`);
      setBusy(false);
      return;
    }

    let posterTempPath="";
    if(isVideo){
      try{
        const poster=await createFinalVideoFrameFile(file);
        posterTempPath=`${user.id}/admin-upload/${uploadId}-poster.jpg`;
        const posterUpload=await supabase.storage.from("invitation-location-images").upload(posterTempPath,poster,{
          contentType:"image/jpeg",
          cacheControl:"3600",
          upsert:false
        });
        if(posterUpload.error){
          await supabase.storage.from(bucket).remove([tempPath]);
          setMessage(`Anteprima non caricata: ${posterUpload.error.message}`);
          setBusy(false);
          return;
        }
      }catch{
        // Il video resta utilizzabile anche se il browser non riesce a generare il poster.
      }
    }

    const token=await authToken();
    const response=await fetch("/api/template-library",{
      method:"POST",
      headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        name,
        category,
        mediaType:isVideo?"video":"image",
        tempPath,
        posterTempPath,
        originalName:file.name
      })
    });
    const result=await response.json().catch(()=>({})) as {error?:string};
    if(response.ok){
      form.reset();
      setMessage("Template pubblicato nella galleria.");
      await refresh();
    }else{
      await supabase.storage.from(bucket).remove([tempPath]);
      if(posterTempPath)await supabase.storage.from("invitation-location-images").remove([posterTempPath]);
      setMessage(result.error||"Caricamento non riuscito.");
    }
    setBusy(false);
  }

  async function updateItem(item:Item, patch:Partial<Pick<Item,"published"|"name"|"category"|"order">>) {
    const token=await authToken();
    setBusy(true);
    const response=await fetch("/api/template-library",{
      method:"PATCH",
      headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
      body:JSON.stringify({id:item.id,source:item.source,...patch})
    });
    const result=await response.json().catch(()=>({})) as {error?:string};
    setMessage(response.ok?"Template aggiornato.":result.error||"Aggiornamento non riuscito.");
    await refresh();
    setBusy(false);
  }

  async function remove(item:Item) {
    if(item.source==="legacy"){
      await updateItem(item,{published:false});
      setMessage("Template storico nascosto dalla galleria. Il file originale è rimasto intatto.");
      return;
    }
    if(!window.confirm(`Eliminare definitivamente “${item.name}”?`))return;
    const token=await authToken();setBusy(true);
    const response=await fetch("/api/template-library",{
      method:"DELETE",
      headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
      body:JSON.stringify({id:item.id,source:item.source,mediaType:item.mediaType})
    });
    const result=await response.json().catch(()=>({})) as {error?:string};
    setMessage(response.ok?"Template eliminato definitivamente.":result.error||"Eliminazione non riuscita.");
    await refresh();setBusy(false);
  }

  if(allowed===null)return <section className="panel"><p>Verifica accesso...</p></section>;
  if(allowed===false)return <section className="panel"><h1>Gestione Template</h1><p>Questa sezione è riservata agli amministratori.</p></section>;

  return <div>
    <section className="panel">
      <p className="eyebrow">Amministrazione</p>
      <h1>Gestione Template</h1>
      <p className="muted">Qui gestisci sia i template storici sia quelli caricati da voi. I template storici possono essere nascosti, rinominati, spostati di categoria e riordinati senza cancellare il file originale.</p>
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
      <div className="panel-header"><div><p className="eyebrow">Libreria completa</p><h2>Template gestibili</h2></div><strong>{items.length}</strong></div>
      {items.length===0?<div className="empty-state"><h3>Nessun template</h3><p className="muted">I template compariranno qui.</p></div>:
      <div className="template-grid">
        {items.map(item=><article className="template-card" key={`${item.source}-${item.id}`}>
          <div className="template-card-preview" style={{backgroundImage:item.imageUrl?`url("${item.imageUrl}")`:undefined,backgroundPosition:"center",backgroundSize:"cover"}}>
            {item.mediaType==="video"?<video src={item.videoUrl} poster={item.posterUrl||undefined} muted loop playsInline controls style={{width:"100%",height:"100%",objectFit:"cover"}}/>:null}
          </div>
          <div className="template-card-body">
            <div>
              <small style={{fontWeight:800,textTransform:"uppercase",letterSpacing:".06em"}}>{item.source==="legacy"?"Storico":"Caricato da voi"}</small>
              <input
                defaultValue={item.name}
                aria-label={`Nome ${item.name}`}
                onBlur={(event)=>{const value=event.currentTarget.value.trim();if(value&&value!==item.name)void updateItem(item,{name:value});}}
              />
              <select
                value={item.category}
                onChange={(event)=>void updateItem(item,{category:event.target.value})}
                aria-label={`Categoria ${item.name}`}
              >
                {categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}
              </select>
              <label style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
                <span>Ordine</span>
                <input
                  type="number"
                  min="0"
                  defaultValue={item.order}
                  style={{width:90}}
                  onBlur={(event)=>{const value=Number(event.currentTarget.value);if(Number.isFinite(value)&&value!==item.order)void updateItem(item,{order:value});}}
                />
              </label>
              <span className={`status ${item.published?"confirmed":"pending"}`} style={{marginTop:8}}>{item.published?"Pubblicato":"Nascosto"}</span>
            </div>
            <div className="draft-actions" style={{marginTop:12}}>
              <button className="button secondary" disabled={busy} type="button" onClick={()=>void updateItem(item,{published:!item.published})}>{item.published?"Nascondi":"Pubblica"}</button>
              <button className="draft-delete-button" disabled={busy} type="button" onClick={()=>void remove(item)}>{item.source==="legacy"?"Archivia":"Elimina"}</button>
            </div>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}
