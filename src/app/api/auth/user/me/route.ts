import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const cookies = request.headers.get("cookie");
    if (!cookies) return NextResponse.json({ user: null });

    const cookieObj = cookies.split(";").reduce((acc: any, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key) acc[key] = value;
      return acc;
    }, {});

    const sessionToken = cookieObj["user_session"];
    if (!sessionToken) return NextResponse.json({ user: null });

    const session = verifySession(sessionToken);
    if (!session || session.role !== "user") {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: session.id,
        username: session.username,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
