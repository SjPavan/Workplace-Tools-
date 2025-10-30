const request = require('supertest');
const app = require('../src/app');
const conversationStore = require('../src/memory/conversationStore');

describe('Coding assistant APIs', () => {
  beforeEach(() => {
    if (conversationStore.reset) {
      conversationStore.reset();
    }
  });

  it('generates code with syntax aware prompt and detection metadata', async () => {
    const response = await request(app)
      .post('/api/assistant/generate')
      .send({
        prompt: 'create a function that sums two numbers',
        starterCode: 'function sum(a, b) { return a + b }'
      })
      .expect(200);

    expect(response.body).toMatchObject({
      kind: 'generate',
      language: 'javascript',
      model: expect.stringContaining('CodeLlama'),
      metadata: {
        languageDetection: expect.objectContaining({
          language: 'javascript'
        }),
        historySize: 2
      }
    });

    expect(response.body.prompt).toContain('CodeLlama');
    expect(response.body.message).toContain('function');
    expect(response.body.id).toBeTruthy();
    expect(response.body.conversationId).toBeTruthy();
  });

  it('explains code and carries forward conversation history', async () => {
    const generate = await request(app)
      .post('/api/assistant/generate')
      .send({ prompt: 'make a helper to normalise text' })
      .expect(200);

    const conversationId = generate.body.conversationId;

    const response = await request(app)
      .post('/api/assistant/explain')
      .send({
        conversationId,
        question: 'What does this Python function return?',
        code: 'def greet(name):\n    return "Hello " + name\n'
      })
      .expect(200);

    expect(response.body.language).toBe('python');
    expect(response.body.model).toContain('StarCoder');
    expect(response.body.metadata.languageDetection).toEqual(
      expect.objectContaining({ language: 'python' })
    );
    expect(response.body.metadata.historySize).toBeGreaterThan(2);
    expect(response.body.message).toContain('question');
  });

  it('debugs code with lint feedback and diff suggestions', async () => {
    const conversation = await request(app)
      .post('/api/assistant/generate')
      .send({ prompt: 'start conversation' })
      .expect(200);

    const conversationId = conversation.body.conversationId;
    const buggyCode = 'var total = value\nconsole.log(total)\n';

    const response = await request(app)
      .post('/api/assistant/debug')
      .send({
        conversationId,
        issue: 'Console log is missing a semicolon and var should be const',
        code: buggyCode
      })
      .expect(200);

    expect(response.body.language).toBe('javascript');
    expect(response.body.model).toContain('CodeLlama');
    expect(response.body.metadata.lintFeedback.length).toBeGreaterThan(0);
    expect(response.body.metadata.diffChanges).toBeGreaterThan(0);
    expect(response.body.metadata.diff).toContain('--- original');
    expect(response.body.metadata.fixedCode).toContain('const total');
    expect(response.body.metadata.historySize).toBeGreaterThan(2);
    expect(response.body.message).toContain('Issue reported');
  });
});
