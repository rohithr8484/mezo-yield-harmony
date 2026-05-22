/**
 * x402 Payment Client (Mezo Testnet, Permit2 / mUSD)
 *
 * 1) GET the resource — receive 402 + PaymentRequirements
 * 2) Sign a Permit2 EIP-712 PermitTransferFrom for mUSD
 * 3) Retry GET with X-PAYMENT header (base64 PaymentPayload)
 * 4) Print the joke + on-chain tx hash from X-PAYMENT-RESPONSE
 *
 * Run:  cd client && npx tsx client.ts
 *
 * One-time setup (Permit2 must be approved to pull mUSD from the client):
 *   cast send $MUSD "approve(address,uint256)" $PERMIT2 $(cast max-uint) \
 *     --private-key $CLIENT_PRIVATE_KEY --rpc-url $RPC_URL
 */
import { config } from "dotenv";
import {
  createPublicClient,
  createWalletClient,
  http,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { randomBytes } from "node:crypto";
config();

const {
  CLIENT_PRIVATE_KEY,
  SERVER_URL = "http://localhost:3000/paid",
  RPC_URL = "https://rpc.test.mezo.org",
  CHAIN_ID = "31611",
  PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  X402_PERMIT2_PROXY = "0x8dea1b08dc2e1D9b556450f736F19968F367A98d",
  MUSD = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
} = process.env;

if (!CLIENT_PRIVATE_KEY) {
  console.error("CLIENT_PRIVATE_KEY missing. Copy .env.example -> .env.");
  process.exit(1);
}

const chainId = Number(CHAIN_ID);
const account = privateKeyToAccount(CLIENT_PRIVATE_KEY as Hex);
const transport = http(RPC_URL);
const publicClient = createPublicClient({ transport });
const wallet = createWalletClient({ account, transport });

const ERC20_ALLOWANCE = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

async function warnIfPermit2NotApproved() {
  const allowance = (await publicClient.readContract({
    address: MUSD as Address,
    abi: ERC20_ALLOWANCE,
    functionName: "allowance",
    args: [account.address, PERMIT2 as Address],
  })) as bigint;
  if (allowance === 0n) {
    console.warn(
      "⚠ Permit2 is NOT approved to spend mUSD from this wallet.\n" +
        "  Run the cast command in this file's header before retrying.",
    );
  } else {
    console.log(`✓ Permit2 allowance: ${allowance}`);
  }
}

async function main() {
  console.log(`client=${account.address}  →  ${SERVER_URL}`);
  await warnIfPermit2NotApproved();

  // Step 1 — probe the resource, expect 402
  const probe = await fetch(SERVER_URL);
  if (probe.status !== 402) {
    console.log("Unexpected status:", probe.status, await probe.text());
    return;
  }
  const { accepts } = (await probe.json()) as any;
  const req = accepts[0];
  console.log(`402 Payment Required → ${req.amount} (atomic) of ${req.asset} → ${req.payTo}`);

  // Step 2 — sign Permit2 PermitTransferFrom
  const nonce = BigInt("0x" + randomBytes(32).toString("hex"));
  const deadline = BigInt(Math.floor(Date.now() / 1000) + req.maxTimeoutSeconds);

  const signature = await wallet.signTypedData({
    account,
    domain: { name: "Permit2", chainId, verifyingContract: PERMIT2 as Address },
    types: {
      PermitTransferFrom: [
        { name: "permitted", type: "TokenPermissions" },
        { name: "spender", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
      TokenPermissions: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
      ],
    },
    primaryType: "PermitTransferFrom",
    message: {
      permitted: { token: req.asset as Address, amount: BigInt(req.amount) },
      spender: (req.spender ?? X402_PERMIT2_PROXY) as Address,
      nonce,
      deadline,
    },
  });

  const paymentPayload = {
    x402Version: 2,
    scheme: "exact",
    network: req.network,
    payload: {
      owner: account.address,
      signature,
      permit: {
        permitted: { token: req.asset, amount: req.amount },
        nonce: toHex(nonce),
        deadline: deadline.toString(),
      },
    },
  };
  const header = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
  console.log(`Signed Permit2 (nonce=${toHex(nonce).slice(0, 18)}…) — retrying with X-PAYMENT`);

  // Step 3 — retry with payment header
  const paid = await fetch(SERVER_URL, { headers: { "X-PAYMENT": header } });
  const body = await paid.json();
  const receiptB64 = paid.headers.get("X-PAYMENT-RESPONSE");
  const receipt = receiptB64 ? JSON.parse(Buffer.from(receiptB64, "base64").toString("utf-8")) : null;

  console.log(`\n${paid.status} ${paid.statusText}`);
  console.log("Body:", body);
  if (receipt) console.log("Receipt:", receipt);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
