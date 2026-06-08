/**
 * Şematik araba önizlemesi (placeholder).
 *
 * Gerçek V-Ray render'ları gelene kadar konfigüratör seçimlerini görselleştirir:
 * gövde/tente/metal rengi, tente var/yok, dekoratif tekerlek, raf↔tutamaç,
 * arka kapak ve 6 açı. Render'lar `RENDER_REGISTRY`'ye eklenince bu çizim
 * otomatik devreden çıkar (bkz. CustomizeDialog).
 *
 * Tamamen string tabanlı (React'tan bağımsız) — çıktı bir SVG data-URI olarak
 * <img src> içinde kullanılır.
 */
import type { AngleId } from "@/data/configurator";
import { isBackAngle } from "@/data/configurator";

export type PreviewParams = {
  angle: AngleId;
  bodyHex: string;
  tente: boolean;
  tenteHex: string;
  wheelsDecorative: boolean;
  /** true = Raf, false = Tutamaç */
  shelf: boolean;
  backCover: boolean;
  metalHex: string;
};

/** Açık zeminde okunabilir bir kontur rengi seç (açık renkler için koyu çizgi). */
function strokeFor(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#999";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.7 ? "#b8b2a6" : "rgba(0,0,0,0.25)";
}

export function cartPreviewSvg(p: PreviewParams): string {
  const back = isBackAngle(p.angle);
  const left = p.angle === "on-sol" || p.angle === "arka-sol";
  const right = p.angle === "on-sag" || p.angle === "arka-sag";
  const diagonal = left || right;

  // 3/4 görünümler için hafif perspektif taklidi.
  const skew = diagonal ? (right ? -7 : 7) : 0;
  const scaleX = diagonal ? 0.94 : 1;
  const flip = left ? -1 : 1;

  const bodyStroke = strokeFor(p.bodyHex);
  const tenteStroke = strokeFor(p.tenteHex);

  // Tente (kumaş çatı) — sadece "var" ise.
  const awning = p.tente
    ? `
      <g>
        <path d="M28 40 L92 40 L84 20 L36 20 Z" fill="${p.tenteHex}" stroke="${tenteStroke}" stroke-width="1"/>
        <path d="M28 40 q 8 6 16 0 q 8 6 16 0 q 8 6 16 0 q 8 6 16 0"
              fill="none" stroke="${tenteStroke}" stroke-width="1.2" opacity="0.7"/>
        <rect x="35" y="38" width="2.5" height="10" fill="${p.metalHex}"/>
        <rect x="82.5" y="38" width="2.5" height="10" fill="${p.metalHex}"/>
      </g>`
    : "";

  // Arka kapak — arka açılarda belirgin panel, ön açılarda üst arka ipucu.
  const backCover = p.backCover
    ? back
      ? `<rect x="36" y="50" width="48" height="40" rx="2" fill="${p.bodyHex}" stroke="${bodyStroke}" stroke-width="1" opacity="0.96"/>`
      : `<rect x="34" y="44" width="52" height="4" fill="${p.bodyHex}" stroke="${bodyStroke}" stroke-width="0.6" opacity="0.85"/>`
    : "";

  // Dekoratif tekerlek aksesuarı (jant göbeği + parmaklıklar).
  function wheel(cx: number): string {
    const deco = p.wheelsDecorative
      ? `<circle cx="${cx}" cy="98" r="4.5" fill="none" stroke="${p.metalHex}" stroke-width="1.4"/>
         <line x1="${cx}" y1="92" x2="${cx}" y2="104" stroke="${p.metalHex}" stroke-width="1"/>
         <line x1="${cx - 6}" y1="98" x2="${cx + 6}" y2="98" stroke="${p.metalHex}" stroke-width="1"/>`
      : "";
    return `
      <circle cx="${cx}" cy="98" r="9" fill="#2b2b2b"/>
      <circle cx="${cx}" cy="98" r="4" fill="${p.metalHex}"/>
      ${deco}`;
  }

  // Tutamaç (dikey kol) ya da Raf (yatay plaka).
  const handleOrShelf = p.shelf
    ? `<rect x="30" y="86" width="60" height="5" rx="1.5" fill="${p.bodyHex}" stroke="${bodyStroke}" stroke-width="0.8"/>`
    : `<rect x="86" y="50" width="3" height="30" rx="1.5" fill="${p.metalHex}"/>
       <rect x="86" y="50" width="9" height="3" rx="1.5" fill="${p.metalHex}"/>`;

  // Ön logo paneli ipucu (yalnız ön açılar; logo overlay'i ayrı bindirilir).
  const frontPanel = !back
    ? `<rect x="44" y="60" width="32" height="22" rx="1.5" fill="rgba(255,255,255,0.06)" stroke="${bodyStroke}" stroke-width="0.8" stroke-dasharray="3 2"/>`
    : "";

  const inner = `
    <ellipse cx="60" cy="110" rx="40" ry="4.5" fill="rgba(0,0,0,0.12)"/>
    ${awning}
    <!-- tezgah üstü lip -->
    <rect x="30" y="42" width="60" height="6" rx="1.5" fill="${p.metalHex}" opacity="0.85"/>
    <!-- gövde -->
    <rect x="34" y="46" width="52" height="44" rx="2.5" fill="${p.bodyHex}" stroke="${bodyStroke}" stroke-width="1.2"/>
    ${backCover}
    ${frontPanel}
    ${handleOrShelf}
    ${wheel(44)}
    ${wheel(76)}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <g transform="translate(60,60) scale(${flip * scaleX},1) skewX(${skew}) translate(-60,-60)">
      ${inner}
    </g>
  </svg>`;

  return svg;
}

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
