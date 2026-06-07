export function getOrigin() {
  const env = process.env.NEXT_PUBLIC_ORIGIN;
  if (env) {
    if (env.startsWith("http://") || env.startsWith("https://")) {
      return env;
    }
    return `https://${env}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
