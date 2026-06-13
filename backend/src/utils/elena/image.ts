import sharp from 'sharp';

const TRIM_LUMINANCE = 80;
const TRIM_MIN_BRIGHT = 5;
const TRIM_MIN_AREA_RATIO = 0.3;

const ICON_LUMINANCE = 180;
const ICON_ZONE_W = 0.20;
const ICON_ZONE_H = 0.25;
const ICON_MIN_RATIO = 0.05;
const ICON_MAX_RATIO = 0.40;

const MAIN_MAX_WIDTH = 1200;
const MAIN_QUALITY = 90;
const THUMB_QUALITY = 92;
const THUMB_SHARPEN_SIGMA = 0.8;

// Jumeaux serveur des constantes calibrées de @shared/services/crop-images/crop.utils.ts
export const CROP_RATIOS = {
  itemCard: { size: 0.130, x: 0.044, y: 0.063, aspect: 1, thumbWidth: 80 },
  bestiaireCard: { size: 0.344, x: 0.031, y: 0.042, aspect: 1.456, thumbWidth: 240 }
} as const;

export type CardType = keyof typeof CROP_RATIOS;

//======= TYPES =======

interface RawImage {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type ProcessResult =
  | { ok: true; main: Buffer; thumb: Buffer }
  | { ok: false; reason: string };

//======= PIXELS =======

async function readRaw(buffer: Buffer): Promise<RawImage | null> {
  try {
    const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height, channels: info.channels };
  } catch {
    return null;
  }
}

function isBright(img: RawImage, x: number, y: number, threshold: number): boolean {
  const i = (y * img.width + x) * img.channels;
  return img.data[i] > threshold || img.data[i + 1] > threshold || img.data[i + 2] > threshold;
}

//======= TRIM (SEUIL DE LUMINOSITÉ, MIN 5 PIXELS PAR LIGNE/COLONNE) =======

type TrimOutcome = { ok: true; box: Box } | { ok: false; reason: string };

function computeTrimBox(img: RawImage): TrimOutcome {
  const w = img.width;
  const h = img.height;

  const rowBright = (y: number): boolean => {
    let count = 0;
    for (let x = 0; x < w; x++) {
      if (isBright(img, x, y, TRIM_LUMINANCE) && ++count >= TRIM_MIN_BRIGHT) return true;
    }
    return false;
  };
  const colBright = (x: number): boolean => {
    let count = 0;
    for (let y = 0; y < h; y++) {
      if (isBright(img, x, y, TRIM_LUMINANCE) && ++count >= TRIM_MIN_BRIGHT) return true;
    }
    return false;
  };

  let top = 0;
  while (top < h && !rowBright(top)) top++;
  if (top >= h) {
    return { ok: false, reason: 'aucune zone claire détectée' };
  }

  let bottom = h - 1;
  while (bottom > top && !rowBright(bottom)) bottom--;
  let left = 0;
  while (left < w && !colBright(left)) left++;
  let right = w - 1;
  while (right > left && !colBright(right)) right--;

  const boxW = right - left + 1;
  const boxH = bottom - top + 1;

  if (boxW * boxH < w * h * TRIM_MIN_AREA_RATIO) {
    return { ok: false, reason: 'cadrage incertain (zone claire trop petite)' };
  }

  return { ok: true, box: { left, top, width: boxW, height: boxH } };
}

//======= DÉTECTION DU CADRE D'ICÔNE (COIN HAUT-GAUCHE DE LA CARTE TRIMÉE) =======

function detectIconBox(img: RawImage, trim: Box): Box | null {
  const nw = trim.width;
  const nh = trim.height;
  const zoneW = Math.round(nw * ICON_ZONE_W);
  const zoneH = Math.round(Math.min(nh, nw * ICON_ZONE_H));

  const rowBright = (y: number): boolean => {
    for (let x = 0; x < zoneW; x++) {
      if (isBright(img, trim.left + x, trim.top + y, ICON_LUMINANCE)) return true;
    }
    return false;
  };

  let minY = 0;
  while (minY < zoneH && !rowBright(minY)) minY++;
  if (minY >= zoneH) return null;

  let maxY = minY;
  let gap = 0;
  for (let y = minY + 1; y < zoneH && gap <= 2; y++) {
    if (rowBright(y)) {
      maxY = y;
      gap = 0;
    } else {
      gap++;
    }
  }

  let minX = zoneW;
  let maxX = -1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = 0; x < zoneW; x++) {
      if (isBright(img, trim.left + x, trim.top + y, ICON_LUMINANCE)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxX < 0) return null;

  const size = Math.max(maxX - minX + 1, maxY - minY + 1);
  if (size < nw * ICON_MIN_RATIO || size > nw * ICON_MAX_RATIO) return null;

  return { left: minX, top: minY, width: size, height: size };
}

//======= CROP MINIATURE (ICÔNE DÉTECTÉE OU RATIOS, EN COORDONNÉES ORIGINALES) =======

function thumbCropBox(img: RawImage, trim: Box, card: CardType): Box {
  const ratios = CROP_RATIOS[card];

  if (card === 'itemCard') {
    const icon = detectIconBox(img, trim);
    if (icon) {
      return {
        left: trim.left + icon.left,
        top: trim.top + icon.top,
        width: icon.width,
        height: icon.height
      };
    }
  }

  const cropW = Math.round(trim.width * ratios.size);
  return {
    left: trim.left + Math.round(trim.width * ratios.x),
    top: trim.top + Math.round(trim.width * ratios.y),
    width: cropW,
    height: Math.round(cropW / ratios.aspect)
  };
}

function clampBox(box: Box, width: number, height: number): Box {
  const left = Math.max(0, Math.min(box.left, width - 1));
  const top = Math.max(0, Math.min(box.top, height - 1));
  return {
    left,
    top,
    width: Math.max(1, Math.min(box.width, width - left)),
    height: Math.max(1, Math.min(box.height, height - top))
  };
}

//======= MOULINETTE D'UNE IMAGE =======

export async function processLotImage(buffer: Buffer, card: CardType): Promise<ProcessResult> {
  const raw = await readRaw(buffer);
  if (!raw) {
    return { ok: false, reason: 'image illisible' };
  }

  const trim = computeTrimBox(raw);
  if (!trim.ok) {
    return { ok: false, reason: trim.reason };
  }

  const trimBox = clampBox(trim.box, raw.width, raw.height);
  const thumbBox = clampBox(thumbCropBox(raw, trimBox, card), raw.width, raw.height);
  const ratios = CROP_RATIOS[card];
  const thumbHeight = Math.round(ratios.thumbWidth / ratios.aspect);

  try {
    const main = await sharp(buffer)
      .extract(trimBox)
      .resize({ width: MAIN_MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: MAIN_QUALITY })
      .toBuffer();

    const thumb = await sharp(buffer)
      .extract(thumbBox)
      .resize(ratios.thumbWidth, thumbHeight, { fit: 'fill' })
      .sharpen({ sigma: THUMB_SHARPEN_SIGMA })
      .jpeg({ quality: THUMB_QUALITY })
      .toBuffer();

    return { ok: true, main, thumb };
  } catch {
    return { ok: false, reason: 'échec du traitement' };
  }
}
