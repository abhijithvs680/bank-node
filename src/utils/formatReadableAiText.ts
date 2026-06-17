export interface ParsedListItem {
  id?: string;
  details: string;
  status?: string;
}

export interface ReadableAiContent {
  intro?: string;
  items: ParsedListItem[];
  paragraphs: string[];
}

const NUMBERED_SPLIT = /\s(?=\d+\.\s)/;

function parseListItem(raw: string): ParsedListItem {
  const cleaned = raw.replace(/^\d+\.\s*/, '').trim();
  const idMatch = cleaned.match(/^([A-Z]{2,}-[\w-]+):\s*(.+)$/i);
  if (!idMatch) {
    const statusMatch = cleaned.match(/Status:\s*(.+)$/i);
    if (statusMatch) {
      return {
        details: cleaned.slice(0, statusMatch.index).replace(/,\s*$/, '').trim(),
        status: statusMatch[1].trim(),
      };
    }
    return { details: cleaned };
  }

  const id = idMatch[1];
  const rest = idMatch[2];
  const statusMatch = rest.match(/Status:\s*(.+)$/i);
  if (statusMatch) {
    return {
      id,
      details: rest.slice(0, statusMatch.index).replace(/,\s*$/, '').trim(),
      status: statusMatch[1].trim(),
    };
  }

  return { id, details: rest };
}

export function parseReadableAiText(text: string): ReadableAiContent {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return { items: [], paragraphs: [] };
  }

  if (NUMBERED_SPLIT.test(normalized)) {
    const parts = normalized.split(NUMBERED_SPLIT);
    const intro = parts[0].replace(/:\s*$/, '').trim();
    const items = parts.slice(1).map(parseListItem).filter((item) => item.details || item.id);
    return { intro, items, paragraphs: [] };
  }

  const lineItems = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lineItems.filter((line) => /^[-•*]\s/.test(line));
  if (bulletLines.length >= 2) {
    return {
      paragraphs: lineItems.filter((line) => !/^[-•*]\s/.test(line)),
      items: bulletLines.map((line) => parseListItem(line.replace(/^[-•*]\s*/, ''))),
    };
  }

  const sentences = normalized.split(/(?<=\.)\s+(?=[A-Z])/);
  if (sentences.length >= 3) {
    return {
      paragraphs: [sentences[0]],
      items: sentences.slice(1).map((sentence) => parseListItem(sentence)),
    };
  }

  return { items: [], paragraphs: [normalized] };
}
