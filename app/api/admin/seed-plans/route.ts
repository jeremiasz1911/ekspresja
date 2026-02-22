import { NextResponse } from "next/server";
import { seedDefaultPlans } from "@/services/seed-plans";

export async function POST() {
  try {
    await seedDefaultPlans();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "seed failed" }, { status: 500 });
  }
}
