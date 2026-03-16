import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const snap = await adminDb
      .collection("classes")
      .where("isActive", "==", true)
      .get();

    const classes = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    }));

    return NextResponse.json({ classes });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Nie udało się pobrać zajęć." },
      { status: 500 }
    );
  }
}
