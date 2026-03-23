import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./keys/ekspresja-firebase-admin.json", "utf8")
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

async function run() {
  const snap = await db.collection("materials").get();
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const isPaid = data.accessLevel && data.accessLevel !== "free";
    const hasPrice = typeof data.priceCents === "number";

    if (isPaid && !hasPrice) {
      await doc.ref.update({
        priceCents: 2490,
        updatedAt: Date.now(),
      });
      updated += 1;
    }
  }

  console.log(`Updated materials with missing prices: ${updated}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
