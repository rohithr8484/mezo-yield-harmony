/**
 * Humor Server (x402 protected)
 *
 *   GET  /free   -> 200, no payment
 *   GET  /paid   -> 402 with PaymentRequirements (no X-PAYMENT header)
 *                -> 200 with joke + tx hash (valid X-PAYMENT header)
 *
 * Run: cd server && npx tsx humor-server.ts
 */
import express from "express";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "dotenv";
config();

const {
  PAYEE_ADDRESS,
  PORT = "3000",
  FACILITATOR_URL = "http://localhost:4022",
  CHAIN_ID = "31611",
  MUSD = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  X402_PERMIT2_PROXY = "0x8dea1b08dc2e1D9b556450f736F19968F367A98d",
  PRICE_ATOMIC = "1000000000000000",
} = process.env;

if (!PAYEE_ADDRESS) {
  console.error("PAYEE_ADDRESS missing. Copy .env.example -> .env.");
  process.exit(1);
}

const JOKES_PATH = join(import.meta.dirname, "..", "jokes.json");

const paymentRequirements = {
  scheme: "exact",
  network: `eip155:${CHAIN_ID}`,
  asset: MUSD,
  amount: PRICE_ATOMIC,
  payTo: PAYEE_ADDRESS,
  spender: X402_PERMIT2_PROXY, // Permit2 proxy is the on-chain spender
  maxTimeoutSeconds: 300,
  extra: { name: "Mezo USD", version: "1", assetTransferMethod: "permit2" },
};

const app = express();
app.use(express.json());

app.get("/free", async (_req, res) => {
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.json(jokes[Math.floor(Math.random() * jokes.length)]);
});

app.get("/paid", async (req, res) => {
  const header = req.header("X-PAYMENT");
  if (!header) {
    res.status(402).json({
      x402Version: 2,
      error: "Payment required",
      accepts: [paymentRequirements],
    });
    return;
  }

  let paymentPayload: any;
  try {
    paymentPayload = JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
  } catch {
    res.status(400).json({ error: "Malformed X-PAYMENT header" });
    return;
  }

  // 1) verify with facilitator
  const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentPayload, paymentRequirements }),
  });
  const verifyJson = await verifyRes.json();
  if (!verifyJson.isValid) {
    res.status(402).json({ error: "Invalid payment", detail: verifyJson });
    return;
  }

  // 2) settle on-chain
  const settleRes = await fetch(`${FACILITATOR_URL}/settle`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentPayload, paymentRequirements }),
  });
  const settleJson = await settleRes.json();
  if (!settleJson.success) {
    res.status(502).json({ error: "Settlement failed", detail: settleJson });
    return;
  }

  // 3) deliver resource + receipt header
  const jokes = JSON.parse(await readFile(JOKES_PATH, "utf-8"));
  res.setHeader(
    "X-PAYMENT-RESPONSE",
    Buffer.from(JSON.stringify({ txHash: settleJson.txHash, payer: settleJson.payer })).toString("base64"),
  );
  res.json({
    joke: jokes[Math.floor(Math.random() * jokes.length)],
    settlement: { txHash: settleJson.txHash, payer: settleJson.payer },
  });
});

app.listen(Number(PORT), () => {
  console.log(`Humor Server on :${PORT}  payee=${PAYEE_ADDRESS}`);
  console.log(`  /paid  costs ${PRICE_ATOMIC} (atomic mUSD)  facilitator=${FACILITATOR_URL}`);
});
