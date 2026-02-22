// app/api/payments/tpay/start/route.ts
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { buildTpayForm } from "@/services/tpay.service";

export async function GET(req: NextRequest) {
  const intentId = req.nextUrl.searchParams.get("intentId");

  if (!intentId) {
    return new Response("Missing intentId", { status: 400 });
  }

  const snap = await adminDb
    .collection("payment_intents")
    .doc(intentId)
    .get();

  if (!snap.exists) {
    return new Response("PaymentIntent not found", { status: 404 });
  }

  const intent = snap.data()!;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

  const tpay = buildTpayForm({
    merchantId: process.env.TPAY_MERCHANT_ID!,
    securityCode: process.env.TPAY_MD5_SECRET!, // ← KOD ZABEZPIECZAJĄCY
    amountCents: intent.amountCents,
    crc: intentId,
    description: "Zajęcia muzyczne",
    email: "test@test.pl",
    returnUrl: `${APP_URL}/dashboard/payments?intent=${intentId}`,
    resultUrl: `${APP_URL}/api/payments/tpay/webhook`,
  });

  return new Response(
    `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>TPAY DEBUG</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    pre { background: #111; color: #0f0; padding: 12px; }
    button { font-size: 16px; padding: 10px 20px; }
  </style>
</head>
<body>
  <h1>TPAY DEBUG FORM</h1>

  <h2>POST → ${tpay.action}</h2>

  <pre>${JSON.stringify(tpay.fields, null, 2)}</pre>

  <form method="POST" action="${tpay.action}">
    ${Object.entries(tpay.fields)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}" />`)
      .join("\n")}
    <button type="submit">🚀 Wyślij do Tpay (sandbox)</button>
  </form>
</body>
</html>`,
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}
