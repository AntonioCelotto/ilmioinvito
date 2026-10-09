import type { CSSProperties } from "react";
import type { InvitationDraft } from "@/lib/draft-storage";

type InvitationHeroBlockProps = {
  draft: InvitationDraft;
  renderCoverElements?: boolean;
  kickerFallback?: string;
};

function displayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export function InvitationHeroBlock({
  draft,
  renderCoverElements = false,
  kickerFallback = "Il nostro invito"
}: InvitationHeroBlockProps) {
  const coverColor = draft.theme.coverNumberColor ?? "#d6ad60";
  const logoScale = draft.theme.coverLogoScale ?? 1;
  const numberScale = draft.theme.coverNumberScale ?? 1;
  const textScale = draft.theme.coverTextScale ?? 1;

  return (
    <>
      <div
        data-cover-preview-mount
        className="cover-elements-preview"
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          order: -1,
          pointerEvents: "none",
          position: "relative",
          width: "100%",
          zIndex: 20
        }}
      >
        {renderCoverElements && draft.theme.coverLogoUrl ? (
          <div
            style={{
              display: "flex",
              height: `${Math.round(58 * logoScale)}px`,
              justifyContent: "center",
              maxHeight: 105,
              width: `${Math.min(72, Math.round(40 * logoScale))}%`
            }}
          >
            <img
              src={draft.theme.coverLogoUrl}
              alt="Logo"
              style={{ display: "block", height: "100%", objectFit: "contain", width: "100%" }}
            />
          </div>
        ) : null}

        {renderCoverElements && draft.theme.coverNumber ? (
          <div
            style={{
              color: coverColor,
              fontFamily: "Georgia, serif",
              fontSize: `clamp(${38 * numberScale}px,${13 * numberScale}vw,${78 * numberScale}px)`,
              fontWeight: 700,
              lineHeight: 0.82,
              textAlign: "center",
              width: "92%"
            }}
          >
            {draft.theme.coverNumber}
          </div>
        ) : null}

        {renderCoverElements && draft.theme.coverText?.trim() ? (
          <div
            style={{
              color: coverColor,
              fontFamily: "var(--invitation-font-family, inherit)",
              fontSize: `${Math.min(58, 34 * textScale)}px`,
              fontWeight: 700,
              lineHeight: 1.05,
              overflowWrap: "anywhere",
              textAlign: "center",
              width: "92%"
            }}
          >
            {draft.theme.coverText}
          </div>
        ) : null}
      </div>

      <p
        className="phone-kicker invite-kicker"
        style={{
          color: draft.theme.template === "classicLight" ? "#8a7046" : "inherit",
          fontFamily: "var(--invitation-font-family, inherit)",
          fontSize: "calc(13px * var(--invitation-text-scale, 1))",
          fontWeight: 900,
          letterSpacing: "0.13em",
          lineHeight: 1.55,
          margin: 0,
          textTransform: "uppercase"
        }}
      >
        {kickerFallback}
      </p>
      <h2
        className="invitation-hero-title"
        style={{
          color: "inherit",
          fontFamily: "var(--invitation-font-family, inherit)",
          fontSize: "calc(30px * var(--hero-title-scale, 1))",
          margin: 0
        }}
      >
        {draft.title || "Titolo invito"}
      </h2>
      <p
        className="lead invitation-hero-subtitle"
        style={{
          color: "inherit",
          fontFamily: "var(--invitation-font-family, inherit)",
          fontSize: "calc(13px * var(--invitation-text-scale, 1))",
          lineHeight: 1.55,
          margin: 0,
          maxWidth: "100%"
        }}
      >
        {draft.subtitle || "Il sottotitolo apparirà qui"}
      </p>
      <div
        className="phone-meta invite-meta"
        data-meta-style={draft.theme.heroMetaStyle ?? "pills"}
        style={{
          "--hero-meta-scale": draft.theme.heroMetaScale ?? 1,
          fontFamily: "var(--invitation-font-family, inherit)",
          fontSize: "calc(13px * var(--hero-meta-scale, 1))",
          gap: 7,
          justifyContent: "center",
          marginTop: 6
        } as CSSProperties}
      >
        <span
          style={{
            border: "1px solid currentColor",
            borderRadius: 999,
            color: coverColor,
            fontSize: "inherit",
            fontWeight: 800,
            opacity: 0.85,
            padding: "5px 8px"
          }}
        >
          {displayDate(draft.eventDate || "Data")}
        </span>
        <span style={{ color: coverColor, display: "none" }}>{draft.eventTime || "Ora"}</span>
      </div>
    </>
  );
}
