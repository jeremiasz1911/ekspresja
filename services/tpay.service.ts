// services/tpay.service.ts
import crypto from "crypto";

/**
 * =====================================================
 *  🔧 KONFIG TESTOWA – ZMIENIASZ TYLKO TO
 * =====================================================
 *
 * 0 – KANONICZNY (id + amount + crc + secret)
 * 1 – id + crc + amount + secret
 * 2 – id|amount|crc|secret
 * 3 – amount bez .00
 * 4 – kwota w groszach
 * 5 – krótkie crc (cyfry)
 * 6 – FAKE secret (TEST)
 */
const TPAY_MD5_VARIANT = 3; // ⬅️ ZMIENIAJ TYLKO TO (0–6)

/**
 * =====================================================
 */

function mask(s: string) {
  if (!s) return "EMPTY";
  return `${s.slice(0, 2)}***${s.slice(-2)}`;
}

export function buildTpayForm(params: {
  merchantId: string;
  securityCode: string;
  amountCents: number;
  crc: string;
  description: string;
  email: string;
  returnUrl: string;
  resultUrl: string;
}) {
  // ====== STAŁE TESTOWE ======
  const merchantId = params.merchantId;
  const securityCode = params.securityCode;

  let amount = (params.amountCents / 100).toFixed(2);
  let crc = params.crc;

  // ====== WARIANTY ======
  let raw = "";

  switch (TPAY_MD5_VARIANT) {
    case 0:
      // ✅ KANONICZNY (OFICJALNY)
      raw = `${merchantId}${amount}${crc}${securityCode}`;
      break;

    case 1:
      raw = `${merchantId}${crc}${amount}${securityCode}`;
      break;

    case 2:
      raw = `${merchantId}|${amount}|${crc}|${securityCode}`;
      break;

    case 3:
      amount = String(Number(amount)); // bez .00
      raw = `${merchantId}${amount}${crc}${securityCode}`;
      break;

    case 4:
      amount = String(params.amountCents); // grosze
      raw = `${merchantId}${amount}${crc}${securityCode}`;
      break;

    case 5:
      crc = "123456";
      raw = `${merchantId}${amount}${crc}${securityCode}`;
      break;

    case 6:
      raw = `${merchantId}${amount}${crc}TEST`;
      break;

    default:
      throw new Error("Unknown TPAY_MD5_VARIANT");
  }

  const md5sum = crypto
    .createHash("md5")
    .update(raw, "utf8")
    .digest("hex");

  // =====================================================
  // 🧪 MEGA DEBUG – TERMINAL
  // =====================================================
  console.log("\n========== TPAY BUILD ==========");
  console.log("VARIANT:", TPAY_MD5_VARIANT);
  console.log("merchantId:", merchantId);
  console.log("amount:", amount);
  console.log("crc:", crc);
  console.log("securityCode (masked):", mask(securityCode));
  console.log(
    "raw MD5 string (masked):",
    `${merchantId}${amount}${crc}${mask(securityCode)}`
  );
  console.log("md5sum:", md5sum);
  console.log("returnUrl:", params.returnUrl);
  console.log("resultUrl:", params.resultUrl);
  console.log("================================\n");

  const fields: Record<string, string> = {
    id: merchantId,
    amount,
    currency: "PLN",
    crc,

    description: params.description || "TEST",
    email: params.email || "test@test.pl",
    name: "Test Klient",

    lang: "pl",
    accept_tos: "1",

    return_url: params.returnUrl,
    result_url: params.resultUrl,

    md5sum,
  };

  // =====================================================
  // 🧪 DEBUG – CAŁY FORM (W CHROME)
  // =====================================================
  console.log("TPAY FORM FIELDS:");
  Object.entries(fields).forEach(([k, v]) => {
    console.log(`  ${k}:`, v);
  });

  return {
    action: "https://secure.sandbox.tpay.com",
    fields,
  };
}
