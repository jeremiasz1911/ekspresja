// app/api/tpay/webhook/route.ts
import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import {
  finalizePaidIntent,
  markIntentFailed,
} from "@/services/billing-finalize.service";

export const runtime = "nodejs";

/** Tpay POST: application/x-www-form-urlencoded */
function parseFormUrlEncoded(raw: string) {
  const sp = new URLSearchParams(raw);
  const obj: Record<string, string> = {};
  for (const [k, v] of sp.entries()) obj[k] = v;
  return obj;
}

function md5(input: string) {
  return crypto.createHash("md5").update(input, "utf8").digest("hex");
}

function mask(s?: string, left = 4, right = 4) {
  if (!s) return "EMPTY";
  if (s.length <= left + right) return `${s.slice(0, 1)}***`;
  return `${s.slice(0, left)}***${s.slice(-right)}`;
}

function tpayOk() {
  // KLUCZ: Tpay oczekuje "TRUE" jako body (text/plain), inaczej robi retry
  return new Response("TRUE", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const payload = parseFormUrlEncoded(raw);

  // wyciągnięcie pól
  const merchantId = String(payload.id || "").trim();
  const trId = String(payload.tr_id || "").trim();
  const intentId = String(payload.tr_crc || "").trim(); // u Ciebie: intentId
  const trStatus = String(payload.tr_status || "").trim(); // "TRUE" / "FALSE"
  const trAmount = String(payload.tr_amount || "").trim(); // np "40.00"
  const md5sum = String(payload.md5sum || "").trim();

  console.log("\n=== TPAY WEBHOOK IN ===");
  console.log("merchantId:", mask(merchantId));
  console.log("trId:", mask(trId));
  console.log("intentId:", mask(intentId));
  console.log("trStatus:", trStatus);
  console.log("trAmount:", trAmount);
  console.log("md5sum:", mask(md5sum));
  console.log("payloadKeys:", Object.keys(payload));
  console.log("=======================\n");

  // Minimalna walidacja — zawsze TRUE, żeby nie było retry storm
  if (!merchantId || !trId || !intentId) {
    console.error("[TPAY WEBHOOK] Missing required fields", {
      merchantId: !!merchantId,
      trId: !!trId,
      intentId: !!intentId,
    });
    return tpayOk();
  }

  // 1) MD5 verify (opcjonalnie, ale polecam)
  const md5Secret = (process.env.TPAY_MD5_SECRET || "").trim();
  if (md5Secret) {
    // Najczęściej spotykany układ: md5(id + tr_id + tr_amount + tr_crc + secret)
    const expected = md5(`${merchantId}${trId}${trAmount}${intentId}${md5Secret}`);
    if (expected !== md5sum) {
      console.error("[TPAY WEBHOOK] MD5 mismatch", {
        expected: mask(expected),
        got: mask(md5sum),
      });
      // ✅ nie przetwarzamy, ale zwracamy TRUE żeby Tpay nie retryował w kółko
      return tpayOk();
    }
  } else {
    // nie spamuj w prod logami, ale warto wiedzieć w dev
    console.warn("[TPAY WEBHOOK] TPAY_MD5_SECRET not set -> skipping MD5 verify");
  }

  // 2) Pobierz PaymentIntent
  const intentRef = adminDb.collection("payment_intents").doc(intentId);

  const snap = await intentRef.get();
  if (!snap.exists) {
    console.error("[TPAY WEBHOOK] PaymentIntent not found:", intentId);
    return tpayOk();
  }

  const intent: any = snap.data() || {};

  // Idempotencja: jeśli już finalizedAt -> nic nie robimy
  if (intent.finalizedAt) {
    console.log("[TPAY WEBHOOK] already finalized:", intentId);
    return tpayOk();
  }

  // (opcjonalnie) anty-duplikacja: ustaw processingAt tylko jeśli jeszcze nie było
  // dzięki temu jak Tpay uderzy 2x na raz, drugi request szybko zakończy
  try {
    await adminDb.runTransaction(async (tx) => {
      const fresh = await tx.get(intentRef);
      const data: any = fresh.data() || {};

      if (data.finalizedAt) return; // już zakończone
      if (data.processingAt) {
        // ktoś już obrabia — nie przerywamy, tylko pozwalamy temu dojść do końca
        return;
      }

      tx.set(
        intentRef,
        { processingAt: Date.now(), updatedAt: Date.now() },
        { merge: true }
      );
    });
  } catch (e) {
    // nie przerywamy webhooka — zawsze TRUE
    console.warn("[TPAY WEBHOOK] processingAt transaction failed (non-fatal)", e);
  }

  // 3) FAIL
  if (trStatus !== "TRUE") {
    try {
      await markIntentFailed({
        intentId,
        providerTransactionId: trId,
      });
      await intentRef.set(
        { processingAt: null, updatedAt: Date.now() },
        { merge: true }
      );
      console.log("[TPAY WEBHOOK] Marked intent failed:", intentId);
    } catch (e) {
      console.error("[TPAY WEBHOOK] markIntentFailed error", e);
    }
    return tpayOk();
  }

  // 4) PAID -> FINALIZE
  try {
    await finalizePaidIntent({
      intentId,
      providerTransactionId: trId,
    });

    // wyczyść processingAt
    await intentRef.set(
      { processingAt: null, updatedAt: Date.now() },
      { merge: true }
    );

    console.log("[TPAY WEBHOOK] Finalized intent:", intentId);
  } catch (e) {
    console.error("[TPAY WEBHOOK] Finalize error", e);

    // nie kończymy FALSE — ale warto wyczyścić processingAt, by kolejne retry mogło spróbować ponownie
    try {
      await intentRef.set(
        { processingAt: null, updatedAt: Date.now() },
        { merge: true }
      );
    } catch {}
  }

  return tpayOk();
}

export async function GET() {
  return new Response("OK", { status: 200 });
}
