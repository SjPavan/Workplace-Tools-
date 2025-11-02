const HuggingFaceAdapter = require('./huggingfaceAdapter');
const GroqAdapter = require('./groqAdapter');
const GeminiAdapter = require('./geminiAdapter');
const LocalLlamaAdapter = require('./localLlamaAdapter');

function createDefaultProviders(options = {}) {
  const shared = options.shared || {};

  const buildProvider = (Adapter, specificOptions = {}, instance) => {
    if (instance) {
      return instance;
    }

    return new Adapter({
      ...shared,
      ...specificOptions
    });
  };

  return {
    huggingface: buildProvider(HuggingFaceAdapter, options.huggingface, options.huggingfaceInstance),
    groq: buildProvider(GroqAdapter, options.groq, options.groqInstance),
    gemini: buildProvider(GeminiAdapter, options.gemini, options.geminiInstance),
    local: buildProvider(LocalLlamaAdapter, options.local, options.localInstance)
  };
}

module.exports = {
  createDefaultProviders
};
