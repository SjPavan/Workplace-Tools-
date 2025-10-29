import { normalizeWhitespace, splitIntoSentences, words } from '../utils/stringUtils.js';

function selectSummarizationModel(textLength, chunkCount) {
  if (textLength < 800 || chunkCount < 3) {
    return 'concise-snapshot';
  }

  if (textLength < 2500 || chunkCount < 8) {
    return 'balanced-digest';
  }

  return 'comprehensive-review';
}

function buildSummary(chunks, model) {
  const joined = normalizeWhitespace(chunks.map((chunk) => chunk.text).join(' '));
  const sentences = splitIntoSentences(joined);

  if (sentences.length === 0) {
    return joined;
  }

  if (model === 'concise-snapshot') {
    return sentences.slice(0, 2).join(' ');
  }

  if (model === 'balanced-digest') {
    const selection = [sentences[0]];
    if (sentences.length > 2) {
      selection.push(sentences[Math.floor(sentences.length / 2)]);
    }
    if (sentences.length > 1) {
      selection.push(sentences[sentences.length - 1]);
    }
    return selection.filter(Boolean).join(' ');
  }

  const scored = sentences.map((sentence) => {
    const uniqueWords = new Set(words(sentence));
    return { sentence, score: uniqueWords.size };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map((item) => item.sentence).join(' ');
}

function deriveKeyPoints(summary) {
  const points = splitIntoSentences(summary)
    .map((sentence) => sentence.replace(/[:;]$/, '').trim())
    .filter((sentence) => words(sentence).length >= 4 && sentence.length > 15);

  if (points.length === 0 && summary) {
    points.push(summary);
  }

  return points.slice(0, 6);
}

function deriveCitations(keyPoints, chunks) {
  return keyPoints.map((point, index) => {
    const keyWords = new Set(words(point));
    let best = { chunkId: null, score: 0 };

    for (const chunk of chunks) {
      const chunkWords = new Set(words(chunk.text));
      let matches = 0;
      for (const keyWord of keyWords) {
        if (chunkWords.has(keyWord)) {
          matches += 1;
        }
      }

      if (matches > best.score) {
        best = { chunkId: chunk.id, score: matches };
      }
    }

    return {
      keyPointIndex: index,
      chunkId: best.chunkId,
      confidence: best.score === 0 ? 0 : Math.min(1, best.score / keyWords.size)
    };
  });
}

export function orchestrateSummarization(text, chunks) {
  const content = normalizeWhitespace(text);
  const model = selectSummarizationModel(content.length, chunks.length);
  const summary = buildSummary(chunks, model) || content.slice(0, 280);
  const keyPoints = deriveKeyPoints(summary);
  const citations = deriveCitations(keyPoints, chunks);

  return {
    model,
    summary,
    keyPoints,
    citations
  };
}
