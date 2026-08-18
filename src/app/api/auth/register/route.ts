import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { syncParticipantToSheets } from "@/lib/google-sync";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, place, gender, dob, institution, course, address } = body;

    if (!name || !phone || !password) {
      return NextResponse.json({ error: "Missing required fields (Name, Phone number, Password)" }, { status: 400 });
    }

    const trimmedEmail = email ? email.toLowerCase().trim() : null;
    if (trimmedEmail) {
      const existingEmail = await db.user.findUnique({ where: { email: trimmedEmail } });
      if (existingEmail) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
      }
    }

    const existingPhone = await db.user.findUnique({ where: { phone: phone.trim() } });
    if (existingPhone) {
      return NextResponse.json({ error: "An account with this phone number already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const regId = `REG-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const user = await db.user.create({
      data: {
        name: name.trim(),
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        phone: phone.trim(),
        passwordHash,
        role: "USER",
        registration: {
          create: {
            registrationId: regId,
            place: place || null,
            gender: gender || null,
            dob: dob || null,
            institution: institution || null,
            course: course || null,
            address: address || null,
            status: "PENDING_VERIFICATION",
          },
        },
      },
      include: {
        registration: true,
      },
    });

    // Background sync trigger
    syncParticipantToSheets(regId).catch(() => {});

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
    console.error("Register Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
