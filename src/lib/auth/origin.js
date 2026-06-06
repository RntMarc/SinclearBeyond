export function getOrigin() {
  return process.env.NEXT_PUBLIC_ORIGIN
    ? `https://${process.env.NEXT_PUBLIC_ORIGIN}`
    : "http://localhost:3000";
}
