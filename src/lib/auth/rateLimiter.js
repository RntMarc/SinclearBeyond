import { RateLimiterMemory } from "rate-limiter-flexible";

export const otpRequestLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 60 * 10, // per 10 minutes
});

export const otpVerifyLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60 * 10,
});
