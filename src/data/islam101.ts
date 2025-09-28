import type { Question } from '../types';
// Vite raw import of the source text. Put the full list in islam101.txt.
// Each block should follow the pattern shown in your message.
import raw from './islam101.txt?raw';

function cleanOption(text: string): string {
  return text.replace(/✔️/g, '').replace(/\s+/g, ' ').trim();
}

function isSkippableLine(line: string): boolean {
  const l = line.trim();
  if (!l) return true;
  const skipStarts = [
    'Read the story',
    'Read about',
    'Find out',
    'Click here',
    'Here are',
    'Read a short',
  ];
  return skipStarts.some((s) => l.toLowerCase().startsWith(s.toLowerCase()));
}

function summarizeExplanation(text: string, answer: string): string {
  const cleaned = text
    .split('\n')
    .filter((l) => !isSkippableLine(l))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return `Correct answer: ${answer}.`;
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  let out = '';
  for (const s of sentences) {
    if ((out + ' ' + s).trim().length > 240) break;
    out = (out ? out + ' ' : '') + s.trim();
    if (out.length >= 120) break; // keep concise
  }
  return out || `Correct answer: ${answer}.`;
}

function parseBlocks(src: string): Question[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (/^\s*\d+\)\s/.test(line)) {
      if (current.length) blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current);

  const results: Question[] = [];

  for (const block of blocks) {
    if (block.length === 0) continue;
    const first = block[0];
    const qMatch = first.match(/^\s*\d+\)\s*(.+)$/);
    if (!qMatch) continue;
    const questionBase = qMatch[1].trim();

    // Collect the first 4 non-empty lines after the first as options
    const rest = block.slice(1);
    const optionLines: string[] = [];
    for (const l of rest) {
      const t = l.trim();
      if (!t) continue;
      optionLines.push(t);
      if (optionLines.length === 4) break;
    }
    if (optionLines.length < 4) continue; // skip malformed

    const correctFlags = optionLines.map((ol) => /✔️/.test(ol));
    const options = optionLines.map(cleanOption);
    const correctOptions = options.filter((_, i) => correctFlags[i]);

    // Explanation lines are everything after the 4 options
    const explLines = rest.slice(
      rest.findIndex((l) => l.trim() === optionLines[3]) + 1
    );
    const explanationRaw = explLines.join('\n');

    // If multi-correct, split into parts to keep app model (single answer) intact
    const parts = correctOptions.length > 1 ? correctOptions.length : 1;
    const answers = parts > 1 ? correctOptions : [correctOptions[0] || options[0]];

    for (let i = 0; i < parts; i++) {
      const answer = answers[i];
      const explanation = summarizeExplanation(explanationRaw, answer);
      const qText = parts > 1 ? `${questionBase} (part ${i + 1}/${parts})` : questionBase;
      results.push({
        question: qText,
        options,
        answer,
        topic: 'Islam 101',
        explanation,
      });
    }
  }

  return results;
}

export const islam101Questions: Question[] = parseBlocks(raw || '');

