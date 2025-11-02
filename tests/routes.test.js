const request = require('supertest');
const createApp = require('../src/app');
const { ProviderError } = require('../src/util/errors');

function createStreamingGenerator(chunks) {
  return (async function* streamGenerator() {
    for (const chunk of chunks) {
      yield chunk;
    }
  })();
}

describe('AI completion routes', () => {
  it('returns completion payloads', async () => {
    const orchestrator = {
      complete: jest.fn().mockResolvedValue({
        text: 'Hello world',
        provider: 'local',
        fromCache: false
      }),
      streamComplete: jest.fn()
    };

    const app = createApp({ orchestrator });
    const response = await request(app)
      .post('/ai/complete')
      .send({ prompt: 'Hi' })
      .expect(200);

    expect(response.body.text).toBe('Hello world');
    expect(orchestrator.complete).toHaveBeenCalledWith({ prompt: 'Hi' });
  });

  it('maps provider rate limit errors to HTTP 429', async () => {
    const orchestrator = {
      complete: jest.fn(() => {
        throw new ProviderError('Rate limit exceeded', {
          providerName: 'groq',
          isRateLimit: true,
          retryAfter: 5
        });
      }),
      streamComplete: jest.fn()
    };

    const app = createApp({ orchestrator });
    const response = await request(app)
      .post('/ai/complete')
      .send({ prompt: 'Hi' })
      .expect(429);

    expect(response.headers['retry-after']).toBe('5');
    expect(response.body.provider).toBe('groq');
  });

  it('streams results using Server-Sent Events when requested', async () => {
    const orchestrator = {
      complete: jest.fn(),
      streamComplete: jest.fn(() =>
        createStreamingGenerator([
          { event: 'chunk', text: 'Hello', provider: 'local' },
          { event: 'chunk', text: ' there', provider: 'local' },
          { event: 'end', provider: 'local' }
        ])
      )
    };

    const app = createApp({ orchestrator });

    const response = await request(app)
      .post('/ai/complete?stream=true')
      .send({ prompt: 'Stream please' })
      .buffer(true)
      .parse((res, callback) => {
        res.setEncoding('utf8');
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => callback(null, data));
      })
      .expect(200);

    const payload = response.text;
    expect(payload).toContain('data: {"event":"chunk","text":"Hello","provider":"local"}');
    expect(orchestrator.streamComplete).toHaveBeenCalledWith({ prompt: 'Stream please' });
    expect(orchestrator.complete).not.toHaveBeenCalled();
  });
});
