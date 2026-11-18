import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import type { PdfRow, PdfRound, PdfScore, ScenarioPdfModel } from './scenario-pdf-model';

export type ScenarioPdfContent = 'full' | 'springs-only';

const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const MARGIN = 32;
const GAP = 15;
const COLUMN_WIDTH = (A4_LANDSCAPE[0] - 2 * MARGIN - 2 * GAP) / 3;
const ROW_STYLE = {
  full: { size: 9, lineHeight: 10.5 },
  'springs-only': { size: 11, lineHeight: 14 },
};
const INK = rgb(0.10, 0.16, 0.22);
const MUTED = rgb(0.34, 0.39, 0.44);
const RULE = rgb(0.70, 0.73, 0.75);

function scoreText(label: string, score: PdfScore) {
  return `${label} ${score.value ?? '—'}${score.status === 'Beregnet' ? '' : ` (${score.status})`}`;
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const combined = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(combined, size) <= width) {
      line = combined;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    for (const character of word) {
      if (line && font.widthOfTextAtSize(`${line}${character}`, size) > width) {
        lines.push(line);
        line = '';
      }
      line += character;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function drawLines(page: PDFPage, lines: string[], font: PDFFont, x: number, y: number, size: number, color = INK, lineHeight = size + 3) {
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color });
    y -= lineHeight;
  }
  return y;
}

function rowLines(row: PdfRow, font: PDFFont, content: ScenarioPdfContent) {
  const spring = `${row.spring}${row.direction ? ` · ${row.direction}` : ''}`;
  const lines = content === 'springs-only' ? [`${row.number}. ${spring}`] : [
    `${row.role === 'Reserve' ? `${row.number}. prioritet` : `${row.number}. ${row.role}`} · ${row.athlete}`,
    spring,
    row.reception && !row.reception.startsWith('Modtagning nulstillet') ? `Modtagning: ${row.reception}` : '',
    row.warning ? `Afklar: ${row.warning}` : '',
  ].filter(Boolean);
  return lines.flatMap((text) => wrap(text, font, ROW_STYLE[content].size, COLUMN_WIDTH - 14));
}

function drawRow(page: PDFPage, lines: string[], font: PDFFont, x: number, y: number, { size, lineHeight }: (typeof ROW_STYLE)[ScenarioPdfContent]) {
  y = drawLines(page, lines, font, x + 6, y - 2, size, INK, lineHeight);
  page.drawLine({ start: { x, y: y + 6 }, end: { x: x + COLUMN_WIDTH, y: y + 6 }, thickness: 0.45, color: RULE });
  return y - 2;
}

interface Cursor { starters: number; reserves: number }

function drawRound(page: PDFPage, round: PdfRound, cursor: Cursor, font: PDFFont, x: number, top: number, continuation: boolean, content: ScenarioPdfContent) {
  if (continuation && cursor.starters >= round.starters.length && cursor.reserves >= round.reserves.length) return;
  const onlySprings = content === 'springs-only';
  const rowStyle = ROW_STYLE[content];
  let y = top;
  const heading = continuation ? `${round.title} · fortsat` : round.title;
  y = drawLines(page, wrap(heading, font, 13, COLUMN_WIDTH), font, x, y, 13) - (onlySprings ? 4 : 10);
  if (!onlySprings) {
    y = drawLines(page, wrap(`${round.status} · ${scoreText('D', round.difficulty)}`, font, 9, COLUMN_WIDTH), font, x, y, 9) - 4;
  }
  page.drawLine({ start: { x, y }, end: { x: x + COLUMN_WIDTH, y }, thickness: 1, color: INK });
  y -= 10;
  if (!round.starters.length && !continuation) {
    page.drawText(onlySprings ? 'Ingen planlagte spring' : 'Ingen startere endnu', { x, y, size: rowStyle.size, font, color: MUTED });
    y -= 21;
  }
  while (cursor.starters < round.starters.length) {
    const row = round.starters[cursor.starters]!;
    const lines = rowLines(row, font, content);
    const height = 4 + lines.length * rowStyle.lineHeight;
    const startsCounting = !onlySprings && row.role === 'Tællende' && (cursor.starters === 0 || round.starters[cursor.starters - 1]!.role === 'Ekstra');
    if (y - height - (startsCounting ? 10 : 0) < 44) return;
    if (startsCounting) {
      page.drawText('TÆLLENDE STARTER HER', { x, y, size: 8, font, color: MUTED });
      y -= 10;
    }
    y = drawRow(page, lines, font, x, y, rowStyle);
    cursor.starters++;
  }
  if (onlySprings) return;
  if (round.reserves.length || !continuation) {
    if (y < 76 && round.reserves.length) return;
    y -= 6;
    page.drawText(`RESERVER · PRIORITERET${continuation && cursor.reserves ? ' · FORTSAT' : ''}`, { x, y, size: 9, font, color: INK });
    y -= 13;
  }
  if (!round.reserves.length && !continuation) {
    page.drawText('Ingen reserver', { x, y, size: rowStyle.size, font, color: MUTED });
  }
  while (cursor.reserves < round.reserves.length && (continuation || cursor.reserves < 2)) {
    const lines = rowLines(round.reserves[cursor.reserves]!, font, content);
    if (y - (4 + lines.length * rowStyle.lineHeight) < 44) return;
    y = drawRow(page, lines, font, x, y, rowStyle);
    cursor.reserves++;
  }
}

function safeFilePart(value: string) {
  return value.normalize('NFKC').split('').map((character) => character.charCodeAt(0) < 32 ? ' ' : character)
    .join('').replace(/[<>:"/\\|?*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'unavngivet';
}

export function scenarioPdfFilename(model: ScenarioPdfModel, content: ScenarioPdfContent = 'full') {
  const parts = [model.team, model.discipline, model.scenario].map(safeFilePart);
  if (content === 'springs-only') parts.push('Kun spring');
  return `${parts.join(' - ')}.pdf`;
}

/** Lokal tekstbaseret PDF. Hver række måles og flyttes hel til næste side. */
export async function createScenarioPdf(model: ScenarioPdfModel, fontBytes: ArrayBuffer | Uint8Array, content: ScenarioPdfContent = 'full'): Promise<Uint8Array> {
  const onlySprings = content === 'springs-only';
  const rounds = onlySprings ? model.rounds.map((round) => ({ ...round, reserves: [] })) : model.rounds;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${model.team} · ${model.discipline} · ${model.scenario}`);
  pdf.setSubject(onlySprings ? 'Springplan · Kun spring' : rounds.map((round) => `${round.title}: ${round.starters.map((row) => row.athlete).join(', ')}`).join(' | '));
  pdf.setKeywords(model.unsaved ? ['Ugemt kladde'] : []);
  pdf.setCreationDate(model.exportedAt);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const stamp = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short' }).format(model.exportedAt);
  const cursors = rounds.map((): Cursor => ({ starters: 0, reserves: 0 }));
  let pageNumber = 0;
  do {
    const page = pdf.addPage(A4_LANDSCAPE);
    pageNumber++;
    page.drawText('SPRINGPLAN', { x: MARGIN, y: 554, size: 10, font, color: MUTED });
    const title = `${model.team} · ${model.discipline} · ${model.scenario}`;
    const titleLines = wrap(title, font, 15, A4_LANDSCAPE[0] - 2 * MARGIN);
    const titleBottom = 526 - (titleLines.length - 1) * 18;
    drawLines(page, titleLines, font, MARGIN, 526, 15);
    const metadataY = titleBottom - 20;
    const metadata = `Eksporteret ${stamp}${model.unsaved ? ' · Ugemt kladde' : ''}`;
    page.drawText(metadata, {
      x: MARGIN, y: metadataY, size: 9, font, color: INK,
    });
    let top = metadataY - 22;
    if (!onlySprings) {
      const scores = `Planlagt ${scoreText('D', model.difficulty)} · Planlagt ${scoreText('C', model.composition)}`;
      const scoresWidth = font.widthOfTextAtSize(scores, 9);
      const scoresOnMetadataLine = font.widthOfTextAtSize(metadata, 9) + scoresWidth + 24 <= A4_LANDSCAPE[0] - 2 * MARGIN;
      page.drawText(scores, { x: scoresOnMetadataLine ? A4_LANDSCAPE[0] - MARGIN - scoresWidth : MARGIN,
        y: scoresOnMetadataLine ? metadataY : metadataY - 14, size: 9, font, color: INK });
      if (!scoresOnMetadataLine) top -= 14;
      if (model.ruleWarning) {
        page.drawText(model.ruleWarning, { x: MARGIN, y: top + 9, size: 8, font, color: INK });
        top -= 12;
      }
    }
    if (top < 120) throw new Error('Hold- eller scenarienavnet er for langt til PDF-siden.');
    for (let index = 0; index < rounds.length; index++) {
      const cursor = cursors[index]!;
      const continuation = pageNumber > 1;
      drawRound(page, rounds[index]!, cursor, font, MARGIN + index * (COLUMN_WIDTH + GAP), top, continuation, content);
    }
    page.drawLine({ start: { x: MARGIN, y: 31 }, end: { x: A4_LANDSCAPE[0] - MARGIN, y: 31 }, thickness: 0.5, color: RULE });
    page.drawText(onlySprings ? 'Springplan · Kun spring' : 'Springplan · eksportkopi', { x: MARGIN, y: 18, size: 8, font, color: MUTED });
    page.drawText(`${pageNumber}`, { x: A4_LANDSCAPE[0] - MARGIN - 10, y: 18, size: 8, font, color: MUTED });
    if (pageNumber > 100) throw new Error('Planen er for lang til PDF-eksport.');
  } while (cursors.some((cursor, index) => cursor.starters < rounds[index]!.starters.length || cursor.reserves < rounds[index]!.reserves.length));
  return pdf.save();
}

export async function downloadScenarioPdf(model: ScenarioPdfModel, content: ScenarioPdfContent) {
  const response = await fetch(`${import.meta.env.BASE_URL}fonts/manrope-variable.ttf`);
  if (!response.ok) throw new Error('PDF-skrifttypen kunne ikke indlæses. Prøv igen.');
  const bytes = await createScenarioPdf(model, await response.arrayBuffer(), content);
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = scenarioPdfFilename(model, content);
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
