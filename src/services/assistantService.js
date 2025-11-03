const { v4: uuidv4 } = require('uuid');
const conversationStore = require('../memory/conversationStore');
const languageDetector = require('./languageDetector');
const { buildGeneratePrompt, buildExplainPrompt, buildDebugPrompt } = require('./promptBuilder');
const { lintCode } = require('./lintUtils');
const { createUnifiedDiff } = require('./diffUtils');

function chooseModel(mode, language) {
  const normalized = (language || 'general').toLowerCase();
  if (mode === 'explain') {
    return normalized === 'python'
      ? 'StarCoder2-15B-Python'
      : 'StarCoder2-15B-General';
  }

  if (mode === 'debug') {
    return normalized === 'javascript'
      ? 'CodeLlama-34B-Debug-JS'
      : 'CodeLlama-34B-Debug-General';
  }

  return normalized === 'python'
    ? 'CodeLlama-34B-Generate-Python'
    : 'CodeLlama-34B-Generate-General';
}

function renderFunctionName(instruction) {
  if (!instruction) {
    return 'assistantGenerated';
  }

  const raw = instruction
    .toString()
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ')
    .toLowerCase();

  if (!raw) {
    return 'assistantGenerated';
  }

  return raw.replace(/(?:^|\s)(\w)/g, (_, ch) => ch.toUpperCase()).replace(/\s+/g, '');
}

function synthesiseCode(language, instruction, starter = '') {
  const name = renderFunctionName(instruction);
  const comment = instruction ? `// ${instruction}` : '// Generated helper';
  switch (language) {
    case 'python':
      return [
        `def ${name}_helper(data):`,
        `    """${instruction || 'Generated helper'}"""`,
        starter
          ? `    seed = ${JSON.stringify(starter.trim().split('\n')[0] || 'data')}`
          : '    seed = data',
        '    return seed'
      ].join('\n');
    case 'typescript':
    case 'javascript':
      return [
        comment,
        `function ${name}(input) {`,
        starter ? `  const seed = ${JSON.stringify(starter.trim())};` : '  const seed = input;',
        '  return seed;',
        '}',
        '',
        `export { ${name} };`
      ].join('\n');
    case 'go':
      return [
        'package main',
        '',
        'import "fmt"',
        '',
        `func ${name}(input string) string {`,
        '    seed := input',
        '    return seed',
        '}',
        '',
        'func main() {',
        '    fmt.Println(${name}("example"))',
        '}'
      ].join('\n');
    default:
      return starter || instruction || 'Generated response';
  }
}

function registerTurn(conversationId, userMessage, assistantMessage) {
  conversationStore.appendMessage(conversationId, {
    role: 'user',
    kind: userMessage.kind,
    content: userMessage.content,
    summary: userMessage.summary
  });

  conversationStore.appendMessage(conversationId, {
    role: 'assistant',
    kind: assistantMessage.kind,
    content: assistantMessage.content,
    summary: assistantMessage.summary
  });
}

function baseResponse({ conversation, language, prompt, model, message, metadata, kind }) {
  return {
    id: uuidv4(),
    conversationId: conversation.id,
    model,
    language,
    prompt,
    message,
    metadata: {
      ...metadata,
      historySize: conversation.messages.length
    },
    kind
  };
}

function handleGenerate(payload) {
  const {
    prompt: instruction,
    starterCode = '',
    language: languageHint,
    conversationId,
    filename
  } = payload || {};

  const conversation = conversationStore.getOrCreate(conversationId);
  const detection = languageDetector.detect({ code: starterCode, languageHint, filename });
  const language = detection.language;

  const prompt = buildGeneratePrompt({
    language,
    instruction,
    code: starterCode,
    history: conversation.messages
  });

  const generatedCode = synthesiseCode(language, instruction, starterCode);
  const model = chooseModel('generate', language);

  registerTurn(
    conversation.id,
    {
      kind: 'generate',
      content: instruction || starterCode || 'request',
      summary: instruction || 'code generation request'
    },
    {
      kind: 'generate',
      content: generatedCode,
      summary: `Generated ${language} snippet`
    }
  );

  return baseResponse({
    conversation,
    language,
    prompt,
    model,
    message: generatedCode,
    metadata: {
      languageDetection: detection
    },
    kind: 'generate'
  });
}

function handleExplain(payload) {
  const {
    code = '',
    question,
    language: languageHint,
    conversationId,
    filename
  } = payload || {};

  const conversation = conversationStore.getOrCreate(conversationId);
  const detection = languageDetector.detect({ code, languageHint, filename });
  const language = detection.language;

  const prompt = buildExplainPrompt({
    language,
    code,
    question,
    history: conversation.messages
  });
  const model = chooseModel('explain', language);

  const explanation = `I analysed the ${language} snippet and ${question ? `addressed the question: ${question}.` : 'summarised its behaviour.'}`;

  registerTurn(
    conversation.id,
    {
      kind: 'explain',
      content: code,
      summary: question || 'explain code'
    },
    {
      kind: 'explain',
      content: explanation,
      summary: 'explained the snippet'
    }
  );

  return baseResponse({
    conversation,
    language,
    prompt,
    model,
    message: explanation,
    metadata: {
      languageDetection: detection
    },
    kind: 'explain'
  });
}

function handleDebug(payload) {
  const {
    code = '',
    issue,
    language: languageHint,
    conversationId,
    filename
  } = payload || {};

  const conversation = conversationStore.getOrCreate(conversationId);
  const detection = languageDetector.detect({ code, languageHint, filename });
  const language = detection.language;

  const prompt = buildDebugPrompt({
    language,
    code,
    issue,
    history: conversation.messages
  });
  const model = chooseModel('debug', language);

  const lintResult = lintCode(language, code);
  const fixedCode = lintResult.fixedCode;
  const { diff, changes } = createUnifiedDiff(code, fixedCode, { language });

  const debugMessage = [
    issue ? `Issue reported: ${issue}.` : 'No explicit issue provided.',
    lintResult.issues.length
      ? `Identified ${lintResult.issues.length} potential issue(s).`
      : 'No lint issues detected.',
    changes ? 'Suggested patch is available in metadata.diff.' : 'No code changes suggested.'
  ].join(' ');

  registerTurn(
    conversation.id,
    {
      kind: 'debug',
      content: issue ? `${issue}\n${code}` : code,
      summary: issue || 'debug request'
    },
    {
      kind: 'debug',
      content: debugMessage,
      summary: changes ? 'proposed fix' : 'no fix required'
    }
  );

  return baseResponse({
    conversation,
    language,
    prompt,
    model,
    message: debugMessage,
    metadata: {
      languageDetection: detection,
      lintFeedback: lintResult.issues,
      diff,
      diffChanges: changes,
      fixedCode
    },
    kind: 'debug'
  });
}

module.exports = {
  handleGenerate,
  handleExplain,
  handleDebug
};
