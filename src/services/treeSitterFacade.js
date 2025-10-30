class TreeSitterFacade {
  constructor() {
    this.availableLanguages = [];
    this.parser = null;

    try {
      // Lazy require so we do not hard-fail if native bindings are unavailable.
      // eslint-disable-next-line global-require
      const Parser = require('tree-sitter');
      this.parser = new Parser();
      const languageLoaders = [
        { name: 'javascript', loader: () => require('tree-sitter-javascript') },
        { name: 'typescript', loader: () => require('tree-sitter-typescript').typescript },
        { name: 'tsx', loader: () => require('tree-sitter-typescript').tsx },
        { name: 'python', loader: () => require('tree-sitter-python') },
        { name: 'go', loader: () => require('tree-sitter-go') }
      ];

      languageLoaders.forEach(({ name, loader }) => {
        try {
          const langModule = loader();
          this.availableLanguages.push({ name, module: langModule });
        } catch (error) {
          // Language not installed, skip silently.
        }
      });
    } catch (error) {
      this.parser = null;
    }
  }

  detect(code) {
    if (!this.parser || this.availableLanguages.length === 0) {
      return null;
    }

    const trimmed = (code || '').trim();
    if (!trimmed) {
      return null;
    }

    for (const language of this.availableLanguages) {
      try {
        this.parser.setLanguage(language.module);
        const tree = this.parser.parse(trimmed);
        if (tree && tree.rootNode && !tree.rootNode.hasError()) {
          return language.name;
        }
      } catch (error) {
        // Parsing failed for this language, continue.
      }
    }

    return null;
  }
}

module.exports = TreeSitterFacade;
