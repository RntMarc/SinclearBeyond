import { cookies } from "next/headers";

const MATRIX_COOKIE = "matrix_session";

export async function setMatrixSession(data) {
  const jar = await cookies();
  // Ensure password is never stored in a long-term way if possible,
  // but here we are using a session cookie which is already relatively safe.
  jar.set(MATRIX_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: true, // Always secure for credentials
    path: "/",
  });
}

export async function getMatrixSession() {
  const jar = await cookies();
  const raw = jar.get(MATRIX_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearMatrixSession() {
  const jar = await cookies();
  jar.delete(MATRIX_COOKIE);
}
