import { cookies } from "next/headers";

const MATRIX_COOKIE = "matrix_session";

export async function setMatrixSession(data) {
  const jar = await cookies();
  jar.set(MATRIX_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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
