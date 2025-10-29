import { STOPWORDS } from '../utils/stopwords.js';
import { uniqueStrings, words } from '../utils/stringUtils.js';

function normalizeProvidedTags(tags = []) {
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return tags.split(',');
    }
    return [tags];
  }

  if (Array.isArray(tags)) {
    return tags;
  }

  return [];
}

export function generateTags(text, providedTags = []) {
  const tokens = words(text).filter((token) => token.length > 2 && !STOPWORDS.has(token));
  const frequencies = new Map();

  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  const ranked = Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([token]) => token);

  const provided = normalizeProvidedTags(providedTags)
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean);

  return uniqueStrings([...provided, ...ranked]);
}
