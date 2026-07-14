import { demoInvitation } from "@/lib/demo-data";
import { InviteRsvp } from "@/components/invite-rsvp";

type InvitePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { slug } = await params;

  return (
    <main>
      <section className="invite-hero">
        <div>
          <p className="eyebrow">Invito digitale</p>
          <h1>{demoInvitation.title}</h1>
          <p className="lead">{demoInvitation.subtitle}</p>
          <div className="invite-meta">
            <span>{demoInvitation.eventDate}</span>
            <span>{demoInvitation.eventTime}</span>
            <span>{demoInvitation.venueName}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner split">
          <div>
            <p className="eyebrow">La storia</p>
            <h2>Un invito pensato per essere personale.</h2>
            <p className="muted">{demoInvitation.story}</p>
          </div>
          <div>
            <p className="eyebrow">Dettagli evento</p>
            <ul className="feature-list">
              <li>
                <h3>Quando</h3>
                <span className="muted">
                  {demoInvitation.eventDate}, ore {demoInvitation.eventTime}
                </span>
              </li>
              <li>
                <h3>Dove</h3>
                <span className="muted">{demoInvitation.venueAddress}</span>
              </li>
              <li>
                <h3>Dress code</h3>
                <span className="muted">{demoInvitation.dressCode}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section dark">
        <div className="section-inner split">
          <div>
            <p className="eyebrow">RSVP</p>
            <h2>Conferma la tua presenza.</h2>
            <p className="muted">
              In questa prima demo il bottone apre WhatsApp. Nel prodotto finale
              la risposta verra salvata anche in dashboard.
            </p>
          </div>
          <div className="rsvp">
            <InviteRsvp
              eventDateIso={demoInvitation.eventDateIso}
              invitationTitle={demoInvitation.title}
              whatsappNumber={demoInvitation.whatsappNumber}
            />
            <a className="button secondary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(demoInvitation.venueAddress)}`}>
              Apri indicazioni
            </a>
            <p className="muted">Slug demo: {slug}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
