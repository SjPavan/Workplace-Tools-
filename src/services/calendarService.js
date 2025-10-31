const { google } = require('googleapis');

let oauthClientFactory = null;

function getOAuthClient() {
  if (oauthClientFactory) {
    return oauthClientFactory();
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth client credentials are not configured.');
  }
  return new google.auth.OAuth2(clientId, clientSecret);
}

async function exchangeCodeForTokens({ code, redirectUri }) {
  if (!code) throw new Error('code is required');
  const client = getOAuthClient();
  const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
  return tokens;
}

async function listUpcomingEvents(tokens, { calendarId = 'primary', maxResults = 10 } = {}) {
  if (!tokens) throw new Error('tokens are required');
  const client = getOAuthClient();
  client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: client });
  const { data } = await calendar.events.list({
    calendarId,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime'
  });
  return data.items || [];
}

function __setOAuthClientFactory(factory) {
  oauthClientFactory = factory;
}

function __resetOAuthClientFactory() {
  oauthClientFactory = null;
}

module.exports = {
  exchangeCodeForTokens,
  listUpcomingEvents,
  __setOAuthClientFactory,
  __resetOAuthClientFactory
};
