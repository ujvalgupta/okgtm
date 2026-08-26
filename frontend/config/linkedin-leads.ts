export const LINKEDIN_LEADS_CONFIG = {
  /** Gate the analysis behind email + OTP verification. Off for now (testing). */
  requireEmailVerification: false,
  /** Hard cap on recent posts fetched per profile/company. */
  maxPosts: 5,
  /** Hard cap on comments pulled per post. */
  maxCommentsPerPost: 1,
  otpExpiryMinutes: 10,
  /** How far into the fake loading animation the email gate appears. */
  fakeLoaderDelayMs: 2500,
  /** How often the client polls the analyze status endpoint while a job is running. */
  pollIntervalMs: 3000,
  /** Give up polling after this many attempts (pollIntervalMs * maxPollAttempts ceiling). */
  maxPollAttempts: 60,
  /** Never surface the site owner's own profile as a "lead" in results. */
  ownerProfileUrl: "https://www.linkedin.com/in/ujvalgupta",
} as const;
