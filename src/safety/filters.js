const { SafetyError } = require('../util/errors');

const DEFAULT_BLOCKLIST = [
  'explosive device',
  'self harm',
  'terrorism',
  'hate speech'
];

function normalise(str) {
  return str.normalize('NFKD').toLowerCase();
}

function createSafetyFilter(options = {}) {
  const blocklist = options.blocklist || DEFAULT_BLOCKLIST;
  const maxPromptLength = options.maxPromptLength ?? 8000;

  return {
    checkInput({ prompt }) {
      if (!prompt) {
        return { allowed: true };
      }

      if (prompt.length > maxPromptLength) {
        throw new SafetyError('Prompt exceeds maximum allowed length', {
          code: 'PROMPT_TOO_LONG'
        });
      }

      const normalisedPrompt = normalise(prompt);
      const match = blocklist.find((term) => normalisedPrompt.includes(normalise(term)));

      if (match) {
        throw new SafetyError(`Unsafe content detected (${match})`, {
          code: 'BLOCKED_TERM'
        });
      }

      return { allowed: true };
    },
    blocklist
  };
}

module.exports = {
  createSafetyFilter,
  DEFAULT_BLOCKLIST
};
