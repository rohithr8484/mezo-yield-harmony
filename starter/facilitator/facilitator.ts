/**
 * x402 Facilitator (Mezo Testnet)
 *
 * Verifies x402 PaymentPayloads and settles Permit2 transfers on-chain via
 * the x402Permit2Proxy. Applies a 3x gas multiplier — Mezo's eth_estimateGas
 * currently omits the EIP-7623 calldata floor, so Permit2.settle() would
 * otherwise underestimate and revert. Tracked upstream.
 *
 *   POST /verify  { paymentRequirements, paymentPayload }  -> { isValid }
 *   POST /settle  { paymentRequirements, paymentPayload }  -> { txHash }
 *
 * Run:  cd facilitator && npx tsx facilitator.ts
 */
import express from "express";
import { config } from "dotenv";
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  recoverTypedDataAddress,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
config();

const {
  FACILITATOR_PRIVATE_KEY,
  RPC_URL = "https://rpc.test.mezo.org",
  CHAIN_ID = "31611",
  PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  X402_PERMIT2_PROXY = "0x8dea1b08dc2e1D9b556450f736F19968F367A98d",
  MUSD = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  GAS_MULTIPLIER = "3",
  PORT = "4022",
} = process.env;

if (!FACILITATOR_PRIVATE_KEY) {
  console.error("FACILITATOR_PRIVATE_KEY missing. Copy .env.example -> .env.");
  process.exit(1);
}

const chainId = Number(CHAIN_ID);
const account = privateKeyToAccount(FACILITATOR_PRIVATE_KEY as Hex);
const transport = http(RPC_URL);
const publicClient = createPublicClient({ transport });
const wallet = createWalletClient({ account, transport });

// x402Permit2Proxy.settle(permit, transferDetails, owner, signature)
const PROXY_ABI = [
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "permit",
        type: "tuple",
        components: [
          {
            name: "permitted",
            type: "tuple",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint256" },
            ],
          },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      {
        name: "transferDetails",
        type: "tuple",
        components: [
          { name: "to", type: "address" },
          { name: "requestedAmount", type: "uint256" },
        ],
      },
      { name: "owner", type: "address" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

const PERMIT_TYPES = {
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
} as const;

const domain = (verifyingContract: Address) => ({
  name: "Permit2",
  chainId,
  verifyingContract,
});

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) =>
  res.json({ ok: true, facilitator: account.address, chainId, proxy: X402_PERMIT2_PROXY }),
);

app.post("/verify", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;
    const { permit, owner, signature } = paymentPayload.payload;
    const recovered = await recoverTypedDataAddress({
      domain: domain(PERMIT2 as Address),
      types: PERMIT_TYPES,
      primaryType: "PermitTransferFrom",
      message: {
        permitted: permit.permitted,
        spender: X402_PERMIT2_PROXY as Address,
        nonce: BigInt(permit.nonce),
        deadline: BigInt(permit.deadline),
      },
      signature: signature as Hex,
    });
    const isValid =
      recovered.toLowerCase() === (owner as string).toLowerCase() &&
      BigInt(permit.permitted.amount) >= BigInt(paymentRequirements.amount) &&
      BigInt(permit.deadline) > BigInt(Math.floor(Date.now() / 1000));
    res.json({ isValid, payer: recovered });
  } catch (e) {
    res.status(400).json({ isValid: false, error: (e as Error).message });
  }
});

app.post("/settle", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;
    const { permit, owner, signature } = paymentPayload.payload;

    const args = [
      {
        permitted: {
          token: permit.permitted.token as Address,
          amount: BigInt(permit.permitted.amount),
        },
        nonce: BigInt(permit.nonce),
        deadline: BigInt(permit.deadline),
      },
      {
        to: paymentRequirements.payTo as Address,
        requestedAmount: BigInt(paymentRequirements.amount),
      },
      owner as Address,
      signature as Hex,
    ] as const;

    const data = encodeFunctionData({
      abi: PROXY_ABI,
      functionName: "settle",
      args: args as any,
    });

    // Workaround: Mezo's eth_estimateGas omits EIP-7623 calldata floor.
    const estimated = await publicClient.estimateGas({
      account: account.address,
      to: X402_PERMIT2_PROXY as Address,
      data,
    });
    const gas = (estimated * BigInt(GAS_MULTIPLIER)) / 1n;

    const txHash = await wallet.sendTransaction({
      to: X402_PERMIT2_PROXY as Address,
      data,
      gas,
      chain: null,
    });
    res.json({ success: true, txHash, payer: owner });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

app.listen(Number(PORT), () => {
  console.log(`x402 Facilitator on :${PORT}  account=${account.address}`);
  console.log(`  proxy=${X402_PERMIT2_PROXY}  mUSD=${MUSD}  gasMult=${GAS_MULTIPLIER}x`);
});
