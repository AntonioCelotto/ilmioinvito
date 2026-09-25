import { ImageResponse } from "next/og";
import { loadPublicInvitationSocial } from "@/lib/supabase/public-invitation-social";

export const runtime = "nodejs";

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invitation = await loadPublicInvitationSocial(slug);

  if (!invitation) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fffaf5", color: "#4b292c", fontSize: 72, fontWeight: 700 }}>
        ilmioinvito.com
      </div>,
      { width: 1200, height: 630 }
    );
  }

  const coverText = invitation.coverText || (invitation.celebrationNumber ? "Anni insieme" : "");

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #fff9f4 0%, #fffdf9 48%, #f8eee7 100%)", color: "#4b292c" }}>
      <div style={{ position: "absolute", left: -90, top: -95, width: 310, height: 310, display: "flex", borderRadius: 999, background: "radial-gradient(circle at 65% 65%, #f2b9b7 0 18%, #efcfbf 19% 37%, rgba(255,255,255,0) 38%)", opacity: .9 }} />
      <div style={{ position: "absolute", left: 45, top: 30, width: 105, height: 205, display: "flex", borderRadius: "100% 0 100% 0", background: "#94a56e", transform: "rotate(-35deg)", opacity: .52 }} />
      <div style={{ position: "absolute", right: -75, top: -80, width: 285, height: 285, display: "flex", borderRadius: 999, background: "radial-gradient(circle at 38% 68%, #efa6a6 0 17%, #f3c8bc 18% 39%, rgba(255,255,255,0) 40%)", opacity: .88 }} />
      <div style={{ position: "absolute", right: 30, top: 25, width: 95, height: 210, display: "flex", borderRadius: "0 100% 0 100%", background: "#7f9665", transform: "rotate(28deg)", opacity: .48 }} />
      <div style={{ position: "absolute", left: -70, bottom: -105, width: 270, height: 270, display: "flex", borderRadius: 999, background: "radial-gradient(circle at 65% 35%, #e9a9a8 0 17%, #f5d1c0 18% 40%, rgba(255,255,255,0) 41%)", opacity: .82 }} />
      <div style={{ position: "absolute", right: -65, bottom: -100, width: 270, height: 270, display: "flex", borderRadius: 999, background: "radial-gradient(circle at 35% 30%, #efb5b1 0 16%, #f4d1be 17% 39%, rgba(255,255,255,0) 40%)", opacity: .84 }} />
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "58px 90px" }}>
        <div style={{ display: "flex", fontSize: 23, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 22 }}>
          {invitation.kicker}
        </div>
        <div style={{ display: "flex", fontFamily: "serif", fontSize: invitation.title.length > 28 ? 76 : 92, lineHeight: 1, fontWeight: 700, textShadow: "0 2px 12px rgba(255,255,255,.9)" }}>
          {invitation.title}
        </div>
        <div style={{ display: "flex", fontSize: 22, marginTop: 24, maxWidth: 850 }}>
          {invitation.subtitle}
        </div>
        <div style={{ display: "flex", gap: 30, fontSize: 22, marginTop: 30 }}>
          <span>{formatDate(invitation.eventDate)}</span>
          {invitation.eventTime ? <span>{invitation.eventTime}</span> : null}
        </div>
        {invitation.celebrationNumber || coverText ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#d5aa51", marginTop: 22, textShadow: "0 5px 14px rgba(89,56,18,.28)" }}>
            {invitation.celebrationNumber ? <div style={{ display: "flex", fontFamily: "serif", fontSize: 96, lineHeight: .9, fontWeight: 800 }}>{invitation.celebrationNumber}</div> : null}
            {coverText ? <div style={{ display: "flex", fontFamily: "serif", fontSize: 46, lineHeight: 1, fontWeight: 700, marginTop: 8 }}>{coverText}</div> : null}
          </div>
        ) : null}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" }
    }
  );
}
