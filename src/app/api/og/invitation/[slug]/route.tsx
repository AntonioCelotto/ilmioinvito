import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadPublicInvitationSocial } from "@/lib/supabase/public-invitation-social";

export const runtime = "nodejs";

async function imageSource(value: string) {
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  if (/^\/templates\/[a-z0-9-]+\.(webp|png|jpe?g)$/i.test(value)) {
    try {
      const extension = value.split(".").pop()?.toLowerCase();
      const mime = extension === "png" ? "image/png" : extension === "jpg" || extension === "jpeg" ? "image/jpeg" : "image/webp";
      const file = await readFile(join(process.cwd(), "public", value));
      return `data:${mime};base64,${file.toString("base64")}`;
    } catch {
      return "";
    }
  }
  return "";
}

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

  const backgroundImage = await imageSource(invitation.backgroundImage);
  const coverText = invitation.coverText || (invitation.celebrationNumber ? "Anni insieme" : "");

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#fffaf5", color: "#4b292c" }}>
      {backgroundImage ? (
        <img src={backgroundImage} alt="" width="1200" height="630" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "rgba(255, 252, 247, 0.20)" }} />
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
