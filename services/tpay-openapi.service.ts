// services/tpay-openapi.service.ts
// OpenAPI (sandbox/prod) – transakcja tworzona BasicAuth (clientId:clientSecret)

function mask(s?: string) {
  if (!s) return "EMPTY";
  return `${s.slice(0, 6)}***${s.slice(-4)}`;
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

const TPAY_BASE =
  process.env.TPAY_ENV === "prod"
    ? "https://openapi.tpay.com"
    : "https://openapi.sandbox.tpay.com";

function getBasicAuthHeader() {
  const clientId = process.env.TPAY_CLIENT_ID;
  const clientSecret = process.env.TPAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TPAY_CLIENT_ID / TPAY_CLIENT_SECRET not set");
  }
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return { basic, clientId, header: `Basic ${basic}` };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableStatus(status: number) {
  return [502, 503, 504, 520, 521, 522, 523, 524].includes(status);
}

export async function createTpayTransaction(params: {
  intentId: string;
  amount: number;
  currency: "PLN";
  description: string;
  payerEmail: string;
  payerName?: string;
  successUrl?: string;
  errorUrl?: string;
  notificationUrl?: string;
}) {  
  const { basic, clientId, header } = getBasicAuthHeader();

  const payload: any = {
    amount: Number(params.amount.toFixed(2)),
    currency: params.currency,
    description: params.description,
    hiddenDescription: params.intentId, // 🔥 mapowanie w webhooku
    payer: { email: params.payerEmail },
    callbacks: {
      // ✅ OpenAPI oczekuje takiego kształtu:
      notification: { url: params.notificationUrl },
      payerUrls: {
        success: params.successUrl,
        error: params.errorUrl,
      },
    },
  };

  if (params.payerName) {
    payload.payer.name = params.payerName;
  }

  console.log("\n===== TPAY OPENAPI REQUEST =====");
  console.log("ENV:", process.env.TPAY_ENV);
  console.log("URL:", `${TPAY_BASE}/transactions`);
  console.log("clientId(masked):", mask(clientId));
  console.log("BasicAuth(masked):", `Basic ${mask(basic)}`);
  console.log("payload:", payload);
  console.log("================================\n");

   const maxAttempts = 3;
  let lastData: any = null;
  let lastStatus = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${TPAY_BASE}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${basic}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await readJson(res);
    lastData = data;
    lastStatus = res.status;

    if (res.ok) {
      const paymentUrl =
        data?.transactionPaymentUrl ||
        data?.transaction_payment_url ||
        data?.paymentUrl ||
        data?.payment_url;

      if (!paymentUrl) throw new Error(`No payment url in response: ${JSON.stringify(data)}`);

      return {
        raw: data,
        paymentUrl: String(paymentUrl),
        transactionId: data?.transactionId ?? null,
        title: data?.title ?? null,
      };
    }

    // Retry tylko na “transient”
    if (isRetryableStatus(res.status) && attempt < maxAttempts) {
      const backoff = 400 * Math.pow(2, attempt - 1); // 400ms, 800ms, 1600ms
      console.warn(`[TPAY] transient ${res.status}, retry ${attempt}/${maxAttempts} in ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    throw new Error(
      `Tpay transaction failed (status ${res.status}) :: ${JSON.stringify(data)}`
    );
  }

  throw new Error(
    `Tpay transaction failed (status ${lastStatus}) :: ${JSON.stringify(lastData)}`
  );
  
}

export async function getTpayTransaction(transactionId: string) {
  const { basic, clientId, header } = getBasicAuthHeader();

  const url = `${TPAY_BASE}/transactions/${encodeURIComponent(transactionId)}`;

  console.log("\n===== TPAY GET TX REQUEST =====");
  console.log("URL:", url);
  console.log("clientId(masked):", mask(clientId));
  console.log("BasicAuth(masked):", `Basic ${mask(basic)}`);
  console.log("================================\n");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: header,
    },
  });

  const data = await readJson(res);

  console.log("===== TPAY GET TX RESPONSE =====");
  console.log("status:", res.status);
  console.log("data:", data);
  console.log("================================\n");

  if (!res.ok) {
    throw new Error(
      `Tpay get transaction failed (status ${res.status}) :: ${JSON.stringify(data)}`
    );
  }

  return data;
}
