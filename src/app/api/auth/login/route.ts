import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body; // identifier can be email or phone

    if (!identifier || !password) {
      return NextResponse.json({ error: "Please enter email/phone and password" }, { status: 400 });
    }

    const trimmed = identifier.trim().toLowerCase();
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: trimmed },
          { phone: identifier.trim() },
        ],
      },
      include: {
        registration: {
          include: {
            payments: {
              orderBy: { submittedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials. Account not found." }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password. Please try again." }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, role: user.role, email: user.email || "" });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        registration: user.registration,
      },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
