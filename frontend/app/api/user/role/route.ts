import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "email and role are required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { role },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update role", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
