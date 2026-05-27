import { headers } from "next/headers";

export async function getClientIp() {
  const headersList = await headers();
  const xForwardedFor = headersList.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1";
}
