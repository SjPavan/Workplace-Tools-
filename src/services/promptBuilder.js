function stringifyHistory(history = []) {
  if (!history.length) {
    return 'No previous turns.';
  }

  return history
    .slice(-5)
    .map((entry) => {
      const prefix = entry.role === 'user' ? 'User' : 'Assistant';
      const suffix = entry.kind ? ` (${entry.kind})` : '';
      return `${prefix}${suffix}: ${entry.summary || entry.content}`;
    })
    .join('\n');
}

function buildGeneratePrompt({ language, instruction, code, history }) {
  return [
    `Model: CodeLlama for ${language}`,
    'Task: Author new code based on the instruction.',
    `Instruction: ${instruction || 'N/A'}`,
    code ? `Starter code:\n${code}` : 'Starter code: none',
    'Conversation context:',
    stringifyHistory(history)
  ].join('\n\n');
}

function buildExplainPrompt({ language, code, question, history }) {
  return [
    `Model: StarCoder for ${language}`,
    'Task: Explain the provided code in concise terms.',
    question ? `Focus question: ${question}` : 'Focus question: general overview',
    `Code snippet:\n${code}`,
    'Conversation context:',
    stringifyHistory(history)
  ].join('\n\n');
}

function buildDebugPrompt({ language, code, issue, history }) {
  return [
    `Model: CodeLlama debug mode for ${language}`,
    'Task: Diagnose the issue and produce a patched version of the code.',
    issue ? `Reported issue: ${issue}` : 'Reported issue: not specified',
    `Problematic code:\n${code}`,
    'Conversation context:',
    stringifyHistory(history)
  ].join('\n\n');
}

module.exports = {
  buildGeneratePrompt,
  buildExplainPrompt,
  buildDebugPrompt
};
