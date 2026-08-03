"use client";

import { FormEvent, useEffect, useState } from "react";
import { GuestMediaItem, loadApprovedGuestMedia, uploadGuestMedia } from "@/lib/supabase/guest-media";

export function InviteGuestMedia({ invitationId }: { invitationId: string }) {
  const [items, setItems] = useState<GuestMediaItem[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadApprovedGuestMedia(invitationId).then(setItems);
  }, [invitationId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("media");
    if (!(file instanceof File) || file.size === 0) {
      setMessage("Seleziona una foto o un video.");
      return;
    }
    setUploading(true);
    const result = await uploadGuestMedia(invitationId, String(data.get("guestName") ?? ""), String(data.get("dedication") ?? ""), file);
    setUploading(false);
    setMessage(result.message);
    if (result.ok) form.reset();
  }

  return (
    <div className="guest-media-area">
      <form className="guest-media-form" onSubmit={submit}>
        <div className="field"><label htmlFor={`guest-media-name-${invitationId}`}>Il tuo nome</label><input id={`guest-media-name-${invitationId}`} name="guestName" required /></div>
        <div className="field"><label htmlFor={`guest-media-dedication-${invitationId}`}>Dedica o messaggio</label><textarea id={`guest-media-dedication-${invitationId}`} name="dedication" placeholder="Scrivi una dedica..." /></div>
        <div className="field"><label htmlFor={`guest-media-file-${invitationId}`}>Foto o video</label><input id={`guest-media-file-${invitationId}`} name="media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" required /><small>Massimo 50 MB. Il contenuto sarà pubblicato dopo l’approvazione.</small></div>
        <button className="button" disabled={uploading} type="submit">{uploading ? "Caricamento..." : "Carica il tuo ricordo"}</button>
        {message ? <p className="panel-note">{message}</p> : null}
      </form>
      {items.length > 0 ? <div className="guest-media-gallery">{items.map((item) => <article className="guest-media-card" key={item.id}>{item.mediaType === "photo" ? <img src={item.url} alt={`Ricordo di ${item.guestName}`} /> : <video src={item.url} controls preload="metadata" />}<strong>{item.guestName}</strong>{item.dedication ? <p>{item.dedication}</p> : null}</article>)}</div> : null}
    </div>
  );
}
