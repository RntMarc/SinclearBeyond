import { NextResponse } from "next/server";
import { getAuthenticationOptions } from "@/lib/auth/passkey";

export async function POST() {
  try {
    const options = await getAuthenticationOptions();
    return NextResponse.json(options);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
