"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { GuestMediaItem, loadApprovedGuestMedia, uploadGuestMedia } from "@/lib/supabase/guest-media";

export function InviteGuestMedia({
  enabled,
  invitationId
}: {
  enabled: boolean;
  invitationId: string;
}) {
  const [items, setItems] = useState<GuestMediaItem[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

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
    const result = await uploadGuestMedia(
      invitationId,
      String(data.get("guestName") ?? ""),
      String(data.get("dedication") ?? ""),
      file
    );
    setUploading(false);
    setMessage(result.message);

    if (result.ok) {
      form.reset();
    }
  }

  return (
    <div className="guest-media-area">
      <form className="guest-media-form social-composer" onSubmit={submit}>
        <div className="social-composer-heading">
          <span aria-hidden="true">＋</span>
          <div>
            <strong>Condividi un ricordo</strong>
            <small>Pubblica una foto o un video con la tua dedica.</small>
          </div>
        </div>

        {!enabled ? (
          <p className="social-preview-note">
            Modalità anteprima: puoi provare il caricamento come proprietario. Dopo la pubblicazione sarà disponibile anche agli invitati.
          </p>
        ) : null}

        <div className="field">
          <label htmlFor={`guest-media-name-${invitationId}`}>Il tuo nome</label>
          <input id={`guest-media-name-${invitationId}`} name="guestName" required />
        </div>

        <div className="field">
          <label htmlFor={`guest-media-dedication-${invitationId}`}>Dedica o messaggio</label>
          <textarea id={`guest-media-dedication-${invitationId}`} name="dedication" placeholder="Scrivi una dedica..." />
        </div>

        <div className="field">
          <label>Aggiungi foto o video</label>
          <div className="guest-media-source-actions">
            <button
              className="button secondary guest-media-source-button"
              type="button"
              onClick={() => cameraInputRef.current?.click()}
            >
              <span aria-hidden="true">📷</span>
              Scatta foto
            </button>
            <button
              className="button secondary guest-media-source-button"
              type="button"
              onClick={() => uploadInputRef.current?.click()}
            >
              <span aria-hidden="true">＋</span>
              Carica dal telefono
            </button>
          </div>

          <input
            ref={cameraInputRef}
            id={`guest-media-camera-${invitationId}`}
            name="media-camera"
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (!selected || !uploadInputRef.current) return;
              const transfer = new DataTransfer();
              transfer.items.add(selected);
              uploadInputRef.current.files = transfer.files;
              setMessage(`Foto pronta: ${selected.name}`);
            }}
          />

          <input
            ref={uploadInputRef}
            id={`guest-media-file-${invitationId}`}
            name="media"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            required
            style={{ display: "none" }}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) setMessage(`File pronto: ${selected.name}`);
            }}
          />
          <small>Scatta una foto al momento oppure scegli una foto/video già presente sul telefono. Massimo 50 MB.</small>
        </div>

        <button className="button social-publish-button" disabled={uploading} type="submit">
          {uploading ? "Pubblicazione..." : "Pubblica"}
        </button>

        {message ? <p className="panel-note social-upload-message">{message}</p> : null}
      </form>

      {items.length > 0 ? (
        <div className="guest-media-gallery social-feed">
          {items.map((item) => (
            <article className="guest-media-card social-post" key={item.id}>
              <div className="social-post-author">
                <span>{item.guestName.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{item.guestName}</strong>
                  <small>Ha condiviso un ricordo</small>
                </div>
              </div>
              {item.dedication ? <p className="social-post-dedication">{item.dedication}</p> : null}
              {item.mediaType === "photo" ? (
                <img src={item.url} alt={`Ricordo di ${item.guestName}`} />
              ) : (
                <video src={item.url} controls preload="metadata" />
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Sii il primo a pubblicare un ricordo.</p>
      )}
    </div>
  );
}
