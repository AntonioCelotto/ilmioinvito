import { fontMaxBytes, type FontFormat } from "./shared";
export function validateFontFile(buffer: Uint8Array, fileName: string): FontFormat {
  if (buffer.byteLength < 12 || buffer.byteLength > fontMaxBytes) throw new Error("Il font deve essere valido e non superare 2 MB.");
  const signature = String.fromCharCode(...buffer.slice(0,4));
  const format: FontFormat | null = signature === "wOF2" ? "woff2" : signature === "wOFF" ? "woff" : signature === "OTTO" ? "otf" : buffer[0] === 0 && buffer[1] === 1 && buffer[2] === 0 && buffer[3] === 0 ? "ttf" : null;
  if (!format || fileName.split(".").pop()?.toLowerCase() !== format) throw new Error("Carica un font WOFF2, WOFF, TTF oppure OTF con l’estensione corretta.");
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (format === "woff2" || format === "woff") {
    if (buffer.byteLength < (format === "woff2" ? 48 : 44) || view.getUint32(8) !== buffer.byteLength || view.getUint16(12) === 0) throw new Error("Il file font è incompleto o non valido.");
  } else {
    const tables = view.getUint16(4);
    if (tables === 0 || tables > 4096 || 12 + 16 * tables > buffer.byteLength) throw new Error("Il file font è incompleto o non valido.");
    for (let i=0;i<tables;i++) {
      const offset = view.getUint32(12 + i*16 + 8);
      const length = view.getUint32(12 + i*16 + 12);
      if (offset > buffer.byteLength || length > buffer.byteLength-offset) throw new Error("Le tabelle del font non sono valide.");
    }
  }
  return format;
}
export const fontMime: Record<FontFormat,string> = { woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", otf: "font/otf" };
