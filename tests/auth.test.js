const request = require('supertest');
const app = require('../src/app');
const sessionStore = require('../src/services/sessionStore');
const deviceRegistry = require('../src/services/deviceRegistry');
const googleTokenStore = require('../src/services/googleTokenStore');
const calendarService = require('../src/services/calendarService');
const { __setSupabaseClient } = require('../src/services/supabaseService');

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.GOOGLE_CLIENT_ID = 'google-client';
process.env.GOOGLE_CLIENT_SECRET = 'google-secret';

const buildSupabaseMock = () => ({
  auth: {
    signInWithPassword: jest.fn(),
    exchangeCodeForSession: jest.fn(),
    refreshSession: jest.fn()
  }
});

let supabaseMock;

describe('Auth integration', () => {
  beforeEach(() => {
    supabaseMock = buildSupabaseMock();
    __setSupabaseClient(supabaseMock);
    sessionStore.reset();
    deviceRegistry.reset();
    googleTokenStore.reset();
    if (calendarService.__resetOAuthClientFactory) {
      calendarService.__resetOAuthClientFactory();
    }
    jest.restoreAllMocks();
  });

  test('email/password login creates session and registers device', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-1',
          refresh_token: 'refresh-1',
          token_type: 'bearer',
          expires_in: 3600
        },
        user: {
          id: 'user-1',
          email: 'user@example.com',
          app_metadata: { role: 'admin' }
        }
      },
      error: null
    });

    const response = await request(app)
      .post('/auth/login/email')
      .send({
        email: 'user@example.com',
        password: 'password123',
        deviceToken: 'device-token-abc',
        deviceName: 'iPhone'
      })
      .expect(200);

    expect(response.body.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      role: 'admin'
    });
    expect(response.body.session.accessToken).toBe('access-1');

    const storedSession = sessionStore.getSession('access-1');
    expect(storedSession).toMatchObject({
      refreshToken: 'refresh-1',
      user: { id: 'user-1', role: 'admin' }
    });

    const device = deviceRegistry.validateDevice('user-1', 'device-token-abc');
    expect(device).not.toBeNull();
    expect(device.deviceName).toBe('iPhone');
  });

  test('session refresh exchanges refresh token with Supabase', async () => {
    supabaseMock.auth.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-2',
          refresh_token: 'refresh-2',
          token_type: 'bearer',
          expires_in: 3600
        },
        user: {
          id: 'user-1',
          email: 'user@example.com',
          user_metadata: { role: 'user' }
        }
      },
      error: null
    });

    const response = await request(app)
      .post('/auth/session/refresh')
      .send({ refreshToken: 'refresh-1' })
      .expect(200);

    expect(supabaseMock.auth.refreshSession).toHaveBeenCalledWith({ refresh_token: 'refresh-1' });
    expect(response.body.session.accessToken).toBe('access-2');
    expect(response.body.user.role).toBe('user');
    expect(sessionStore.getSession('access-2')).not.toBeNull();
  });

  test('protected admin route enforces RBAC', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'admin-access',
          refresh_token: 'admin-refresh',
          token_type: 'bearer',
          expires_in: 3600
        },
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          app_metadata: { role: 'admin' }
        }
      },
      error: null
    });

    await request(app)
      .post('/auth/login/email')
      .send({ email: 'admin@example.com', password: 'pass' })
      .expect(200);

    await request(app)
      .get('/admin/reports')
      .set('Authorization', 'Bearer admin-access')
      .expect(200);

    sessionStore.saveSession({
      accessToken: 'user-access',
      refreshToken: 'user-refresh',
      user: { id: 'user-2', role: 'user' }
    });

    await request(app)
      .get('/admin/reports')
      .set('Authorization', 'Bearer user-access')
      .expect(403);
  });

  test('device session exchange refreshes using stored device token', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'device-access-1',
          refresh_token: 'device-refresh-1',
          token_type: 'bearer',
          expires_in: 3600
        },
        user: {
          id: 'user-device',
          email: 'device@example.com',
          app_metadata: { role: 'user' }
        }
      },
      error: null
    });

    supabaseMock.auth.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'device-access-2',
          refresh_token: 'device-refresh-2',
          token_type: 'bearer',
          expires_in: 3600
        },
        user: {
          id: 'user-device',
          email: 'device@example.com',
          app_metadata: { role: 'user' }
        }
      },
      error: null
    });

    await request(app)
      .post('/auth/login/email')
      .send({
        email: 'device@example.com',
        password: 'password',
        deviceToken: 'device-token-xyz'
      })
      .expect(200);

    await request(app)
      .post('/auth/session/exchange')
      .send({ userId: 'user-device', deviceToken: 'device-token-xyz' })
      .expect(200);

    expect(supabaseMock.auth.refreshSession).toHaveBeenCalledWith({ refresh_token: 'device-refresh-1' });
    expect(deviceRegistry.getRefreshToken('user-device', 'device-token-xyz')).toBe('device-refresh-2');
  });

  test('Google calendar token exchange and events retrieval happy path', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'calendar-access',
          refresh_token: 'calendar-refresh',
          token_type: 'bearer',
          expires_in: 3600
        },
        user: {
          id: 'calendar-user',
          email: 'calendar@example.com',
          app_metadata: { role: 'user' }
        }
      },
      error: null
    });

    await request(app)
      .post('/auth/login/email')
      .send({ email: 'calendar@example.com', password: 'password' })
      .expect(200);

    jest.spyOn(calendarService, 'exchangeCodeForTokens').mockResolvedValue({
      access_token: 'google-access',
      refresh_token: 'google-refresh',
      expiry_date: Date.now() + 3600 * 1000
    });

    jest.spyOn(calendarService, 'listUpcomingEvents').mockResolvedValue([
      { id: 'evt-1', summary: 'Standup' },
      { id: 'evt-2', summary: 'Demo' }
    ]);

    await request(app)
      .post('/calendar/oauth/google')
      .set('Authorization', 'Bearer calendar-access')
      .send({ code: 'oauth-code', redirectUri: 'http://localhost/callback' })
      .expect(200);

    const eventsResponse = await request(app)
      .get('/calendar/events')
      .set('Authorization', 'Bearer calendar-access')
      .expect(200);

    expect(eventsResponse.body.events).toHaveLength(2);
    expect(calendarService.listUpcomingEvents).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: 'google-access', refresh_token: 'google-refresh' }),
      expect.objectContaining({ calendarId: 'primary', maxResults: 10 })
    );
  });
});
