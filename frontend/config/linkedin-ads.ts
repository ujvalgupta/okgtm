export const LINKEDIN_ADS_CONFIG = {
  /** Gate the analysis behind email + OTP verification. Off for now (testing). */
  requireEmailVerification: false,
  /** Hard cap on total ads fetched. */
  maxResults: 10,
  otpExpiryMinutes: 10,
  /** How far into the fake loading animation the email gate appears. */
  fakeLoaderDelayMs: 2500,
  /** How often the client polls the analyze status endpoint while a job is running. */
  pollIntervalMs: 3000,
  /** Give up polling after this many attempts (pollIntervalMs * maxPollAttempts ceiling). */
  maxPollAttempts: 60,
} as const;
