"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { demoInvitation } from "@/lib/demo-data";
import { defaultBlockTexts, findDraftBySlug, InvitationDraft, InvitationSectionKey } from "@/lib/draft-storage";
import { findDraftBySlugFromSupabase } from "@/lib/supabase/drafts";
import { InviteRsvp } from "@/components/invite-rsvp";
import { LiveCountdown } from "@/components/live-countdown";
import { InviteGuestMedia } from "@/components/invite-guest-media";

type DraftInviteClientProps = { slug: string };

const fallbackDraft: InvitationDraft = {
  id: "demo", slug: demoInvitation.slug, status: "published", title: demoInvitation.title,
  subtitle: demoInvitation.subtitle, hostName: demoInvitation.hostName, eventDate: demoInvitation.eventDate,
  eventTime: demoInvitation.eventTime, whatsappNumber: demoInvitation.whatsappNumber, story: demoInvitation.story,
  dressCode: demoInvitation.dressCode, giftIban: "", giftWishes: [], blockTexts: defaultBlockTexts,
  activeSections: ["countdown", "reception", "rsvp", "dressCode"],
  locations: [{ id: "demo-location", type: "reception", name: demoInvitation.venueName, address: demoInvitation.venueAddress, description: "", mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(demoInvitation.venueAddress)}`, enabled: true, imageUrl: "" }],
  program: [], media: [],
  theme: { template: "darkLuxury", primaryColor: "#151313", accentColor: "#b87333", fontStyle: "serif", textColor: "#ffffff", buttonColor: "#b87333", buttonTextColor: "#ffffff", fontScale: 1 },
  updatedAt: new Date().toISOString()
};

function sectionIsActive(draft: InvitationDraft, section: InvitationSectionKey) { return draft.activeSections.includes(section); }
function sectionPosition(draft: InvitationDraft, ...sections: InvitationSectionKey[]) { const p=sections.map(s=>draft.activeSections.indexOf(s)).filter(x=>x>=0); return p.length?Math.min(...p):999; }
function blockText(draft: InvitationDraft, section: InvitationSectionKey) { return draft.blockTexts?.[section] || defaultBlockTexts[section]; }
function mapDirectionsUrl(address:string){return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;}
function LocationCard({location}:{location:InvitationDraft["locations"][number]}){return <article className="invite-location">{location.imageUrl?<img alt={location.name||"Luogo dell'evento"} src={location.imageUrl}/>:null}{location.description?<p className="invite-location-description">{location.description}</p>:null}<h3>{location.name||"Luogo dell'evento"}</h3><p className="muted">{location.address||"Indirizzo da definire"}</p>{location.address?<a className="button" href={mapDirectionsUrl(location.address)} rel="noreferrer" target="_blank">Portami</a>:null}</article>}
function CountdownBlock({draft}:{draft:InvitationDraft}){return <LiveCountdown className="countdown-panel light-panel" eventDate={draft.slug===demoInvitation.slug?demoInvitation.eventDateIso.slice(0,10):draft.eventDate} eventTime={draft.eventTime}/>;}

export function DraftInviteClient({slug}:DraftInviteClientProps){
 const[draft,setDraft]=useState<InvitationDraft|null>(null),[loaded,setLoaded]=useState(false),[ibanCopied,setIbanCopied]=useState(false),[videoFinished,setVideoFinished]=useState(false);
 useEffect(()=>{const local=findDraftBySlug(slug);findDraftBySlugFromSupabase(slug).then(remote=>{setDraft(remote??local??null);setLoaded(true);});},[slug]);
 const invitation=draft??fallbackDraft;const primaryLocation=useMemo(()=>invitation.locations.find(l=>["reception","main","church","ceremony"].includes(l.type)),[invitation.locations]);const hasCustomDraft=Boolean(draft),isDemoSlug=slug===demoInvitation.slug;
 useEffect(()=>setVideoFinished(false),[invitation.theme.backgroundVideo]);
 if(loaded&&!hasCustomDraft&&!isDemoSlug)return <main className="workspace"><section className="section"><div className="section-inner"><div className="empty-state invitation-unavailable"><p className="eyebrow">Invito non disponibile</p><h1>Questo invito è ancora in bozza.</h1><p className="muted">La bozza è visibile soltanto al proprietario autenticato. Per condividerla con gli invitati, apri il builder e premi “Pubblica invito”.</p><a className="button" href="/login">Accedi</a></div></div></section></main>;

 const contentBackgroundImage = invitation.theme.backgroundVideo ? "none" : invitation.theme.backgroundImage ? `url("${invitation.theme.backgroundImage}")` : "none";
 const themeStyles={
   "--invitation-text-color":invitation.theme.textColor??"#3f292a",
   "--invitation-button-color":invitation.theme.buttonColor??invitation.theme.accentColor,
   "--invitation-button-text":invitation.theme.buttonTextColor??"#ffffff",
   "--invitation-font-scale":invitation.theme.fontScale??1,
   "--invitation-accent-color":invitation.theme.accentColor,
   "--invitation-primary-color":invitation.theme.primaryColor,
   "--invitation-background-image":contentBackgroundImage,
   backgroundColor:invitation.theme.primaryColor
 } as CSSProperties;

 return <main className={`invitation-custom-theme preview-font-${invitation.theme.fontStyle}`} style={themeStyles}>
  <section className={`invite-hero theme-${invitation.theme.template}`} style={{backgroundColor:invitation.theme.primaryColor,backgroundImage:invitation.theme.backgroundImage?`linear-gradient(rgba(255,250,242,.12),rgba(255,250,242,.22)), url("${invitation.theme.backgroundImage}")`:`linear-gradient(180deg,rgba(15,13,12,.2),${invitation.theme.primaryColor})`,backgroundPosition:"center",backgroundSize:"cover"}}>
   {invitation.theme.backgroundVideo?<video aria-hidden="true" autoPlay className="invite-background-video" muted onEnded={()=>setVideoFinished(true)} playsInline poster={invitation.theme.backgroundImage} preload="auto" src={invitation.theme.backgroundVideo}/>:null}
   {!invitation.theme.backgroundVideo||videoFinished?<div className={invitation.theme.backgroundVideo?"invite-video-data":undefined}><p className="eyebrow">{hasCustomDraft?(invitation.status==="published"?"Invito ufficiale":"Anteprima bozza"):"Invito digitale demo"}</p><h1>{invitation.title}</h1><p className="lead">{invitation.subtitle}</p><div className="invite-meta"><span>{invitation.eventDate}</span><span>{invitation.eventTime}</span>{primaryLocation?<span>{primaryLocation.name}</span>:null}</div></div>:null}
  </section>
  <div className="invite-content-background">
   <section className="section invite-section"><div className="section-inner invite-section-inner"><h2>Un invito pensato per essere personale.</h2><p className="muted invite-copy">{invitation.story}</p></div></section>
   <div className="invite-dynamic-sections">
    {sectionIsActive(invitation,"countdown")?<section className="section invite-section" style={{order:sectionPosition(invitation,"countdown")}}><div className="section-inner invite-section-inner"><h2>Il grande giorno si avvicina.</h2><p className="muted invite-copy">{blockText(invitation,"countdown")}</p><CountdownBlock draft={invitation}/></div></section>:null}
    {sectionIsActive(invitation,"ceremony")||sectionIsActive(invitation,"reception")?<section className="section invite-section" style={{order:sectionPosition(invitation,"ceremony","reception")}}><div className="section-inner invite-section-inner"><h2>Raggiungi ogni momento dell’evento.</h2><p className="muted invite-copy">{blockText(invitation,"ceremony")}</p><div className="invite-location-grid">{invitation.locations.filter(l=>l.enabled).map(l=><LocationCard key={l.id} location={l}/>)}</div></div></section>:null}
    {sectionIsActive(invitation,"program")?<section className="section invite-section" style={{order:sectionPosition(invitation,"program")}}><div className="section-inner invite-section-inner"><h2>La giornata.</h2><p className="muted invite-copy">{blockText(invitation,"program")}</p>{invitation.program.length?<div className="invite-program">{invitation.program.map(i=><article className="invite-program-item" key={i.id}><time>{i.time||"--:--"}</time><p>{i.description||"Programma da definire"}</p></article>)}</div>:<p className="invite-date-line">{invitation.eventDate}{invitation.eventTime?`, ore ${invitation.eventTime}`:""}</p>}</div></section>:null}
    {sectionIsActive(invitation,"dressCode")?<section className="section invite-section" style={{order:sectionPosition(invitation,"dressCode")}}><div className="section-inner invite-section-inner"><div className="invite-dress-code-card"><h2>{invitation.dressCode||"Indicazioni di stile"}</h2><p className="muted invite-copy">{blockText(invitation,"dressCode")}</p></div></div></section>:null}
    {sectionIsActive(invitation,"giftInfo")?<section className="section invite-section" style={{order:sectionPosition(invitation,"giftInfo")}}><div className="section-inner invite-section-inner"><h2>Regalo e dettagli.</h2><p className="muted invite-copy">{blockText(invitation,"giftInfo")}</p>{invitation.giftWishes.length?<div className="gift-wish-grid">{invitation.giftWishes.filter(w=>w.title.trim()).map(w=><article className="gift-wish-card" key={w.id}><span aria-hidden="true">♡</span><strong>{w.title}</strong></article>)}</div>:null}{invitation.giftIban?<div className="gift-iban-card"><span>IBAN per il bonifico</span><strong>{invitation.giftIban}</strong><button className="button" type="button" onClick={async()=>{await navigator.clipboard.writeText(invitation.giftIban);setIbanCopied(true);}}>{ibanCopied?"IBAN copiato":"Copia IBAN"}</button></div>:null}</div></section>:null}
    {sectionIsActive(invitation,"gallery")||sectionIsActive(invitation,"video")?<section className="section invite-section" style={{order:sectionPosition(invitation,"gallery","video")}}><div className="section-inner invite-section-inner"><p className="muted invite-copy">{sectionIsActive(invitation,"video")?blockText(invitation,"video"):blockText(invitation,"gallery")}</p>{invitation.media.some(i=>i.url)?<div className="media-grid">{invitation.media.filter(i=>i.url).map(i=><article className="media-item social-owner-media" key={i.id}>{i.type==="photo"?<img alt={i.title||"Foto dell'invito"} loading="lazy" src={i.url}/>:<video controls preload="metadata" src={i.url}/>}<div><strong>{i.title||"Ricordo"}</strong><a href={i.url} rel="noreferrer" target="_blank">Apri originale</a></div></article>)}</div>:<p className="muted">Nessun media caricato in questa bozza.</p>}<InviteGuestMedia enabled={invitation.status==="published"} invitationId={invitation.id}/></div></section>:null}
    {sectionIsActive(invitation,"rsvp")?<section className="section invite-section invite-rsvp-section" style={{order:sectionPosition(invitation,"rsvp")}}><div className="section-inner invite-section-inner"><div><h2>Conferma la tua presenza.</h2><p className="muted invite-copy">{blockText(invitation,"rsvp")}</p></div><div className="rsvp"><InviteRsvp invitationId={invitation.id} invitationTitle={invitation.title} whatsappNumber={invitation.whatsappNumber}/><p className="muted">Link invito: /i/{invitation.slug}</p></div></div></section>:null}
   </div>
  </div>
 </main>;
}
