import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import type { PdfRow, PdfRound, PdfScore, ScenarioPdfModel } from './scenario-pdf-model';

const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const MARGIN = 32;
const GAP = 15;
const COLUMN_WIDTH = (A4_LANDSCAPE[0] - 2 * MARGIN - 2 * GAP) / 3;
const BODY_SIZE = 9;
const BODY_LINE = 10.5;
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

function rowLines(row: PdfRow, font: PDFFont) {
  const content = [
    `${row.role === 'Reserve' ? `${row.number}. prioritet` : `${row.number}. ${row.role}`} · ${row.athlete}`,
    `${row.spring}${row.direction ? ` · ${row.direction}` : ''}`,
    row.reception && !row.reception.startsWith('Modtagning nulstillet') ? `Modtagning: ${row.reception}` : '',
    row.warning ? `Afklar: ${row.warning}` : '',
  ].filter(Boolean);
  return content.flatMap((text) => wrap(text, font, BODY_SIZE, COLUMN_WIDTH - 14));
}

function drawRow(page: PDFPage, lines: string[], font: PDFFont, x: number, y: number) {
  y = drawLines(page, lines, font, x + 6, y - 2, BODY_SIZE, INK, BODY_LINE);
  page.drawLine({ start: { x, y: y + 6 }, end: { x: x + COLUMN_WIDTH, y: y + 6 }, thickness: 0.45, color: RULE });
  return y - 2;
}

interface Cursor { starters: number; reserves: number }

function drawRound(page: PDFPage, round: PdfRound, cursor: Cursor, font: PDFFont, x: number, top: number, continuation: boolean) {
  if (continuation && cursor.starters >= round.starters.length && cursor.reserves >= round.reserves.length) return;
  let y = top;
  const heading = continuation ? `${round.title} · fortsat` : round.title;
  y = drawLines(page, wrap(heading, font, 13, COLUMN_WIDTH), font, x, y, 13) - 10;
  y = drawLines(page, wrap(`${round.status} · ${scoreText('D', round.difficulty)}`, font, 9, COLUMN_WIDTH), font, x, y, 9) - 4;
  page.drawLine({ start: { x, y }, end: { x: x + COLUMN_WIDTH, y }, thickness: 1, color: INK });
  y -= 10;
  if (!round.starters.length && !continuation) {
    page.drawText('Ingen startere endnu', { x, y, size: BODY_SIZE, font, color: MUTED });
    y -= 21;
  }
  while (cursor.starters < round.starters.length) {
    const row = round.starters[cursor.starters]!;
    const lines = rowLines(row, font);
    const height = 4 + lines.length * BODY_LINE;
    const startsCounting = row.role === 'Tællende' && (cursor.starters === 0 || round.starters[cursor.starters - 1]!.role === 'Ekstra');
    if (y - height - (startsCounting ? 10 : 0) < 44) return;
    if (startsCounting) {
      page.drawText('TÆLLENDE STARTER HER', { x, y, size: 8, font, color: MUTED });
      y -= 10;
    }
    y = drawRow(page, lines, font, x, y);
    cursor.starters++;
  }
  if (round.reserves.length || !continuation) {
    if (y < 76 && round.reserves.length) return;
    y -= 6;
    page.drawText(`RESERVER · PRIORITERET${continuation && cursor.reserves ? ' · FORTSAT' : ''}`, { x, y, size: 9, font, color: INK });
    y -= 13;
  }
  if (!round.reserves.length && !continuation) {
    page.drawText('Ingen reserver', { x, y, size: BODY_SIZE, font, color: MUTED });
  }
  while (cursor.reserves < round.reserves.length && (continuation || cursor.reserves < 2)) {
    const lines = rowLines(round.reserves[cursor.reserves]!, font);
    if (y - (4 + lines.length * BODY_LINE) < 44) return;
    y = drawRow(page, lines, font, x, y);
    cursor.reserves++;
  }
}

function safeFilePart(value: string) {
  return value.normalize('NFKC').split('').map((character) => character.charCodeAt(0) < 32 ? ' ' : character)
    .join('').replace(/[<>:"/\\|?*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'unavngivet';
}

export function scenarioPdfFilename(model: ScenarioPdfModel) {
  return `${[model.team, model.discipline, model.scenario].map(safeFilePart).join(' - ')}.pdf`;
}

/** Lokal tekstbaseret PDF. Hver række måles og flyttes hel til næste side. */
export async function createScenarioPdf(model: ScenarioPdfModel, fontBytes: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${model.team} · ${model.discipline} · ${model.scenario}`);
  pdf.setSubject(model.rounds.map((round) => `${round.title}: ${round.starters.map((row) => row.athlete).join(', ')}`).join(' | '));
  pdf.setKeywords(model.unsaved ? ['Ugemt kladde'] : []);
  pdf.setCreationDate(model.exportedAt);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const stamp = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short' }).format(model.exportedAt);
  const cursors = model.rounds.map((): Cursor => ({ starters: 0, reserves: 0 }));
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
    const scores = `Planlagt ${scoreText('D', model.difficulty)} · Planlagt ${scoreText('C', model.composition)}`;
    const scoresWidth = font.widthOfTextAtSize(scores, 9);
    const scoresOnMetadataLine = font.widthOfTextAtSize(metadata, 9) + scoresWidth + 24 <= A4_LANDSCAPE[0] - 2 * MARGIN;
    page.drawText(scores, { x: scoresOnMetadataLine ? A4_LANDSCAPE[0] - MARGIN - scoresWidth : MARGIN,
      y: scoresOnMetadataLine ? metadataY : metadataY - 14, size: 9, font, color: INK });
    const warningY = metadataY - (scoresOnMetadataLine ? 13 : 27);
    if (model.ruleWarning) page.drawText(model.ruleWarning, { x: MARGIN, y: warningY, size: 8, font, color: INK });
    const top = metadataY - (model.ruleWarning ? (scoresOnMetadataLine ? 34 : 48) : (scoresOnMetadataLine ? 22 : 36));
    if (top < 120) throw new Error('Hold- eller scenarienavnet er for langt til PDF-siden.');
    for (let index = 0; index < model.rounds.length; index++) {
      const cursor = cursors[index]!;
      const continuation = pageNumber > 1;
      drawRound(page, model.rounds[index]!, cursor, font, MARGIN + index * (COLUMN_WIDTH + GAP), top, continuation);
    }
    page.drawLine({ start: { x: MARGIN, y: 31 }, end: { x: A4_LANDSCAPE[0] - MARGIN, y: 31 }, thickness: 0.5, color: RULE });
    page.drawText('Springplan · eksportkopi', { x: MARGIN, y: 18, size: 8, font, color: MUTED });
    page.drawText(`${pageNumber}`, { x: A4_LANDSCAPE[0] - MARGIN - 10, y: 18, size: 8, font, color: MUTED });
    if (pageNumber > 100) throw new Error('Planen er for lang til PDF-eksport.');
  } while (cursors.some((cursor, index) => cursor.starters < model.rounds[index]!.starters.length || cursor.reserves < model.rounds[index]!.reserves.length));
  return pdf.save();
}

export async function downloadScenarioPdf(model: ScenarioPdfModel) {
  const response = await fetch(`${import.meta.env.BASE_URL}fonts/manrope-variable.ttf`);
  if (!response.ok) throw new Error('PDF-skrifttypen kunne ikke indlæses. Prøv igen.');
  const bytes = await createScenarioPdf(model, await response.arrayBuffer());
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = scenarioPdfFilename(model);
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
