const crypto = require('crypto');

function hashToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Token must be a non-empty string');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
}

function timingSafeEqual(hashA, hashB) {
  const buffA = Buffer.from(hashA, 'hex');
  const buffB = Buffer.from(hashB, 'hex');
  if (buffA.length !== buffB.length) {
    return false;
  }
  return crypto.timingSafeEqual(buffA, buffB);
}

function matchHashedToken(storedHash, rawToken) {
  const candidateHash = hashToken(rawToken);
  return timingSafeEqual(storedHash, candidateHash);
}

module.exports = {
  hashToken,
  timingSafeEqual,
  matchHashedToken
};
