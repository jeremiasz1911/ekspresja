import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

function isAdminByEmail(email?: string | null): boolean {
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

async function requireAdminUid(req: Request): Promise<string | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const decoded = await adminAuth.verifyIdToken(token);
  if (isAdminByEmail(decoded.email)) {
    return decoded.uid;
  }

  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const role = userSnap.exists ? String(userSnap.data()?.role || "user") : "user";

  return role === "admin" ? decoded.uid : null;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUid = await requireAdminUid(req);
    if (!adminUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const materialId = String(id || "").trim();

    if (!materialId) {
      return NextResponse.json({ error: "Missing material id" }, { status: 400 });
    }

    const ref = adminDb.collection("materials").doc(materialId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    await ref.delete();

    return NextResponse.json({ ok: true, id: materialId, deletedBy: adminUid });
  } catch (error) {
    console.error("Delete material API error:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
}