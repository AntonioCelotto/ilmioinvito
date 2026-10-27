"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
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
  const [typeFilter,setTypeFilter]=useState<"all"|"image"|"video">("all");
  const [categoryFilter,setCategoryFilter]=useState("all");
  const [draggedKey,setDraggedKey]=useState("");

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

  const visibleItems=useMemo(()=>items.filter((item)=>{
    if(typeFilter!=="all"&&item.mediaType!==typeFilter)return false;
    if(categoryFilter!=="all"&&item.category!==categoryFilter)return false;
    return true;
  }),[items,typeFilter,categoryFilter]);

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
      }catch{}
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

  async function saveOrder(nextItems:Item[]) {
    const token=await authToken();
    setBusy(true);
    setItems(nextItems);
    const response=await fetch("/api/template-library",{
      method:"PATCH",
      headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        orders:nextItems.map((item,index)=>({id:item.id,source:item.source,order:index}))
      })
    });
    const result=await response.json().catch(()=>({})) as {error?:string};
    setMessage(response.ok?"Ordine salvato.":result.error||"Salvataggio ordine non riuscito.");
    if(!response.ok)await refresh();
    setBusy(false);
  }

  function itemKey(item:Item){return `${item.source}-${item.id}`;}

  function dropOn(target:Item,event:DragEvent<HTMLElement>) {
    event.preventDefault();
    if(!draggedKey)return;
    const sourceIndex=items.findIndex((item)=>itemKey(item)===draggedKey);
    const targetIndex=items.findIndex((item)=>itemKey(item)===itemKey(target));
    if(sourceIndex<0||targetIndex<0||sourceIndex===targetIndex){setDraggedKey("");return;}
    const next=[...items];
    const [moved]=next.splice(sourceIndex,1);
    next.splice(targetIndex,0,moved);
    setDraggedKey("");
    void saveOrder(next);
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
      <div className="panel-header">
        <div><p className="eyebrow">Libreria completa</p><h2>Template gestibili</h2></div>
        <strong>{visibleItems.length} / {items.length}</strong>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"end",marginBottom:16}}>
        <label style={{minWidth:160}}>Tipo
          <select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value as "all"|"image"|"video")}>
            <option value="all">Tutti</option>
            <option value="image">Immagini</option>
            <option value="video">Video</option>
          </select>
        </label>
        <label style={{minWidth:200}}>Categoria
          <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)}>
            <option value="all">Tutte</option>
            {categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <span className="muted" style={{fontSize:13}}>Trascina una mini-card per cambiarne la posizione.</span>
      </div>

      {visibleItems.length===0?<div className="empty-state"><h3>Nessun template</h3><p className="muted">Prova a cambiare i filtri.</p></div>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12}}>
        {visibleItems.map(item=><article
          key={itemKey(item)}
          draggable={!busy}
          onDragStart={()=>setDraggedKey(itemKey(item))}
          onDragEnd={()=>setDraggedKey("")}
          onDragOver={(event)=>event.preventDefault()}
          onDrop={(event)=>dropOn(item,event)}
          className="template-card"
          style={{opacity:draggedKey===itemKey(item)?.72:1,cursor:busy?"default":"grab",overflow:"hidden"}}
        >
          <div
            className="template-card-preview"
            style={{
              height:150,
              backgroundImage:item.imageUrl?`url("${item.imageUrl}")`:undefined,
              backgroundPosition:"center",
              backgroundSize:"cover",
              position:"relative"
            }}
          >
            {item.mediaType==="video"?<video src={item.videoUrl} poster={item.posterUrl||undefined} muted loop playsInline preload="metadata" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:null}
            <span style={{position:"absolute",top:6,left:6,background:"rgba(0,0,0,.68)",color:"#fff",borderRadius:999,padding:"3px 7px",fontSize:11,fontWeight:800}}>#{item.order}</span>
            <span style={{position:"absolute",top:6,right:6,background:"rgba(255,255,255,.9)",borderRadius:999,padding:"3px 7px",fontSize:10,fontWeight:800}}>{item.mediaType==="video"?"VIDEO":"IMG"}</span>
          </div>
          <div style={{padding:10,display:"grid",gap:7}}>
            <input
              defaultValue={item.name}
              aria-label={`Nome ${item.name}`}
              style={{fontSize:13,padding:"7px 8px"}}
              onBlur={(event)=>{const value=event.currentTarget.value.trim();if(value&&value!==item.name)void updateItem(item,{name:value});}}
            />
            <select
              value={item.category}
              onChange={(event)=>void updateItem(item,{category:event.target.value})}
              aria-label={`Categoria ${item.name}`}
              style={{fontSize:12,padding:"7px 8px"}}
            >
              {categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:6}}>
              <span className={`status ${item.published?"confirmed":"pending"}`} style={{fontSize:10}}>{item.published?"Pubblicato":"Nascosto"}</span>
              <small style={{fontSize:10,fontWeight:800}}>{item.source==="legacy"?"Storico":"Nuovo"}</small>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <button className="button secondary" style={{padding:"7px 6px",fontSize:11}} disabled={busy} type="button" onClick={()=>void updateItem(item,{published:!item.published})}>{item.published?"Nascondi":"Pubblica"}</button>
              <button className="draft-delete-button" style={{padding:"7px 6px",fontSize:11}} disabled={busy} type="button" onClick={()=>void remove(item)}>{item.source==="legacy"?"Archivia":"Elimina"}</button>
            </div>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}
