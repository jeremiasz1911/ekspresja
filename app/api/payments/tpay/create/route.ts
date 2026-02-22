// app/api/payments/tpay/create/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { createTpayTransaction } from "@/services/tpay-openapi.service";

function maskEmail(s?: string) {
  if (!s) return "EMPTY";
  const [a, b] = s.split("@");
  if (!a || !b) return "INVALID";
  return `${a.slice(0, 2)}***@${b}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const intentId = String(body?.intentId || "").trim();

    console.log("\n=== /api/payments/tpay/create INPUT ===");
    console.log({ intentId, bodyKeys: Object.keys(body || {}) });
    console.log("======================================\n");

    if (!intentId) {
      return NextResponse.json({ error: "Missing intentId" }, { status: 400 });
    }

    const APP_URL =
      process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";

    if (!APP_URL) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL (or APP_URL) not set" },
        { status: 500 }
      );
    }

    const intentRef = adminDb.collection("payment_intents").doc(intentId);
    const snap = await intentRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "PaymentIntent not found", intentId },
        { status: 404 }
      );
    }

    const intent: any = snap.data();

    const amountCents = Number(intent?.amountCents);
    const amount = Number((amountCents / 100).toFixed(2));
    const email = String(intent?.email || "").trim();
    const description = String(
      intent?.description || `Plan ${intent?.planId || ""}`
    ).trim();

    // payerName z users/{uid}
    let payerName: string | undefined = undefined;
    try {
      const parentId = String(intent?.parentId || "").trim();
      if (parentId) {
        const userSnap = await adminDb.collection("users").doc(parentId).get();
        if (userSnap.exists) {
          const u: any = userSnap.data();
          const fn = String(u?.firstName || "").trim();
          const ln = String(u?.lastName || "").trim();
          const full = `${fn} ${ln}`.trim();
          if (full) payerName = full;
        }
      }
    } catch {}

    console.log("=== INTENT DATA (resolved) ===");
    console.log({
      intentId,
      parentId: intent?.parentId,
      amountCents,
      amount,
      emailMasked: maskEmail(email),
      description,
      payerName,
      intentKeys: Object.keys(intent || {}),
      metadataKeys: Object.keys(intent?.metadata || {}),
    });
    console.log("===================================\n");

    if (!amountCents || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount in PaymentIntent", intentId, amountCents },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Missing email in PaymentIntent", intentId },
        { status: 400 }
      );
    }

    // ✅ wracamy na dashboard/classes i pokazujemy banner/toast
    const successUrl = `${APP_URL}/dashboard/classes?payment=success&intent=${intentId}`;
    const errorUrl = `${APP_URL}/dashboard/classes?payment=error&intent=${intentId}`;

    // ✅ webhook:
    const notificationUrl = `${APP_URL}/api/tpay/webhook`;

    const tpay = await createTpayTransaction({
      intentId,
      amount,
      currency: "PLN",
      description,
      payerEmail: email,
      payerName,
      successUrl,
      errorUrl,
      notificationUrl,
    });

    await intentRef.set(
      {
        status: "redirected",
        provider: "tpay",
        providerTransactionId: tpay.transactionId,
        providerTitle: tpay.title,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    return NextResponse.json({ paymentUrl: tpay.paymentUrl });
  } catch (err: any) {
    console.error("TPAY CREATE ERROR:", err);
    return NextResponse.json(
      { error: "TPAY OPENAPI FAILED", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
