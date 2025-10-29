class ProviderError extends Error {
  constructor(message, { providerName, status, retryAfter, isRateLimit = false, cause } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.providerName = providerName;
    this.status = status;
    this.retryAfter = retryAfter;
    this.isRateLimit = isRateLimit;
    if (cause) {
      this.cause = cause;
    }
  }
}

class SafetyError extends Error {
  constructor(message, { code = 'SAFETY_VIOLATION' } = {}) {
    super(message);
    this.name = 'SafetyError';
    this.code = code;
  }
}

module.exports = {
  ProviderError,
  SafetyError
};
