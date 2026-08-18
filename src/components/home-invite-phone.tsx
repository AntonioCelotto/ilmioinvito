"use client";

import { useState } from "react";

export function HomeInvitePhone() {
  const [videoFinished, setVideoFinished] = useState(false);

  return (
    <a className="home-phone-showcase" href="/templates" aria-label="Guarda un esempio completo di invito digitale">
      <div className="home-phone-frame">
        <div className="home-phone-speaker" />
        <div className="home-phone-screen">
          <section className="home-phone-cover home-phone-video-cover">
            <video autoPlay muted playsInline poster="/templates/video/luce-mare.webp" preload="auto" src="/templates/video/luce-mare.mp4" onEnded={() => setVideoFinished(true)} />
            {videoFinished ? (
              <div className="home-phone-video-copy">
                <span>Il nostro matrimonio</span>
                <h2>Sofia &amp; Lorenzo</h2>
                <p>Insieme, per sempre</p>
                <div className="home-phone-date"><b>21</b><span>SETTEMBRE<br />2026</span></div>
              </div>
            ) : null}
          </section>
          <section className="home-phone-preview-content">
            <p>Ci sposiamo!</p><h3>Condividete con noi questo giorno speciale</h3>
            <div className="home-phone-countdown"><span><b>32</b>Giorni</span><span><b>08</b>Ore</span><span><b>24</b>Minuti</span></div>
            <div className="home-phone-location">
              <img src="/home-demo-chiesa.webp" alt="Esempio foto della chiesa" />
              <span>Chiesa</span><strong>Chiesa di Santa Maria</strong><small>Ore 16:30 · Torino</small><em>Portami</em>
            </div>
            <div className="home-phone-location">
              <img src="/home-demo-location.webp" alt="Esempio foto della location" />
              <span>Ricevimento</span><strong>Villa delle Rose</strong><small>Ore 18:30 · Torino</small><em>Portami</em>
            </div>
            <div className="home-phone-social">
              <span>Social</span><strong>I ricordi degli invitati</strong><p>Foto, video e dediche pubblicati durante l’evento.</p>
              <div className="home-phone-social-gallery">
                <img src="/home-demo-social.webp" alt="Ricordo degli invitati" />
                <img src="/home-demo-social.webp" alt="Foto condivisa dagli invitati" />
                <img src="/home-demo-social.webp" alt="Dedica fotografica degli invitati" />
              </div>
              <div className="home-phone-social-add">＋ Aggiungi foto o video</div>
            </div>
            <div className="home-phone-rsvp"><span>Conferma partecipazione</span><strong>Ci sarai?</strong><div><b>Partecipo</b><b>Non partecipo</b></div></div>
          </section>
        </div>
      </div>
      <span className="home-phone-caption">Scorri l’invito completo nel telefono</span>
    </a>
  );
}
