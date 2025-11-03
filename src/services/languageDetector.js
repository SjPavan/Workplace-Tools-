const TreeSitterFacade = require('./treeSitterFacade');

class LanguageDetector {
  constructor() {
    this.treeSitterFacade = new TreeSitterFacade();
  }

  detect({ code = '', languageHint, filename } = {}) {
    if (languageHint && typeof languageHint === 'string') {
      return {
        language: languageHint.toLowerCase(),
        source: 'hint'
      };
    }

    const trimCode = (code || '').trim();
    if (!trimCode && filename) {
      const extension = filename.split('.').pop();
      const mapped = this.mapExtension(extension);
      if (mapped) {
        return { language: mapped, source: 'filename' };
      }
    }

    if (!trimCode) {
      return { language: 'plaintext', source: 'fallback' };
    }

    const parsedLanguage = this.treeSitterFacade.detect(trimCode);
    if (parsedLanguage) {
      return { language: parsedLanguage, source: 'tree-sitter' };
    }

    return {
      language: this.heuristicDetect(trimCode),
      source: 'heuristic'
    };
  }

  heuristicDetect(code) {
    const lower = code.toLowerCase();

    const detectors = [
      {
        language: 'python',
        match: /def\s+\w+\s*\(|import\s+\w+|print\(.*\)|self|:\s*$/m
      },
      {
        language: 'javascript',
        match: /function\s+\w+\s*\(|const\s+\w+|let\s+\w+|=>|console\.log/
      },
      {
        language: 'typescript',
        match: /interface\s+\w+|type\s+\w+\s*=|implements|enum\s+\w+/
      },
      {
        language: 'go',
        match: /package\s+\w+|func\s+\w+|fmt\.Println|var\s+\w+\s+\w+/
      },
      {
        language: 'ruby',
        match: /def\s+\w+|puts\s+|end\s*$/
      },
      {
        language: 'csharp',
        match: /using\s+System|namespace\s+\w+|public\s+(class|interface)/
      }
    ];

    for (const detector of detectors) {
      if (detector.match.test(code) || detector.match.test(lower)) {
        return detector.language;
      }
    }

    if (/class\s+\w+/.test(code) && /public\s+static\s+void\s+main/.test(lower)) {
      return 'java';
    }

    return 'plaintext';
  }

  mapExtension(extension) {
    const lookup = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      go: 'go',
      rb: 'ruby',
      cs: 'csharp',
      java: 'java'
    };
    return lookup[extension.toLowerCase()] || null;
  }
}

module.exports = new LanguageDetector();
module.exports.LanguageDetector = LanguageDetector;
