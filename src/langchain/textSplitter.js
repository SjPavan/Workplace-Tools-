export class RecursiveCharacterTextSplitter {
  constructor({ chunkSize = 1000, chunkOverlap = 200 } = {}) {
    if (chunkSize <= 0) {
      throw new Error('chunkSize must be positive');
    }

    this.chunkSize = chunkSize;
    this.chunkOverlap = Math.max(0, Math.min(chunkOverlap, chunkSize - 1));
  }

  async createDocuments(texts) {
    if (!Array.isArray(texts)) {
      throw new Error('texts must be an array of strings');
    }

    const documents = [];

    for (const text of texts) {
      const normalized = typeof text === 'string' ? text : String(text ?? '');
      const chunks = this.#split(normalized);
      for (const chunk of chunks) {
        documents.push({ pageContent: chunk });
      }
    }

    return documents;
  }

  #split(text) {
    const output = [];
    let start = 0;
    const length = text.length;

    while (start < length) {
      let end = Math.min(start + this.chunkSize, length);
      if (end < length) {
        const breakpoints = ['\n\n', '\n', '. ', ' '];
        let bestBreak = -1;
        for (const separator of breakpoints) {
          const candidate = text.lastIndexOf(separator, end);
          if (candidate > start && candidate < end) {
            const adjusted = candidate + separator.length;
            if (adjusted - start > this.chunkOverlap && adjusted > bestBreak) {
              bestBreak = adjusted;
            }
          }
        }
        if (bestBreak > start) {
          end = bestBreak;
        }
      }

      if (end <= start) {
        end = Math.min(start + this.chunkSize, length);
      }

      const chunk = text.slice(start, end).trim();
      if (chunk) {
        output.push(chunk);
      }

      if (end === length) {
        break;
      }

      start = end - this.chunkOverlap;
      if (start < 0) {
        start = 0;
      }
    }

    return output;
  }
}
