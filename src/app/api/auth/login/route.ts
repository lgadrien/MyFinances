import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ACCESS_PASSWORD;

    if (!correctPassword) {
      console.error("ACCESS_PASSWORD is not set in environment variables");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 },
      );
    }

    if (password === correctPassword) {
      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set("access_token", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
