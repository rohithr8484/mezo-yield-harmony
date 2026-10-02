// x402 sponsored settlement — the facilitator pays the gas, the user only signs.
// Flow: client requests resource → 402 → user signs Permit2 (gasless) → this
// function verifies the signature and settles via x402Permit2Proxy.settle()
// using the facilitator wallet (FACILITATOR_PRIVATE_KEY secret) with a 3x gas
// multiplier (Mezo eth_estimateGas omits the EIP-7623 calldata floor).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createWalletClient, createPublicClient, http, verifyTypedData } from "npm:viem@2";
import { privateKeyToAccount } from "npm:viem@2/accounts";

const MEZO_CHAIN_ID = 31611;
const RPC = "https://rpc.test.mezo.org";
const MUSD = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const X402_PERMIT2_PROXY = "0x8dea1b08dc2e1D9b556450f736F19968F367A98d";
const PAYEE = "0x000000000000000000000000000000000000dEaD";
const PRICE_ATOMIC = 200_000_000_000_000_000n; // 0.2 mUSD

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
      { name: "owner", type: "address" },
      { name: "to", type: "address" },
      { name: "requested", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const { owner, nonce, deadline, signature } = body ?? {};
    if (
      typeof owner !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(owner) ||
      typeof signature !== "string" || !/^0x[0-9a-fA-F]+$/.test(signature) ||
      nonce === undefined || deadline === undefined
    ) {
      return json({ error: "Invalid payload: expected owner, nonce, deadline, signature" }, 400);
    }

    const facilitatorKey = Deno.env.get("FACILITATOR_PRIVATE_KEY");
    if (!facilitatorKey) {
      return json({ error: "Sponsor not configured: FACILITATOR_PRIVATE_KEY secret missing" }, 503);
    }

    const message = {
      permitted: { token: MUSD, amount: PRICE_ATOMIC },
      spender: X402_PERMIT2_PROXY,
      nonce: BigInt(nonce),
      deadline: BigInt(deadline),
    };
    const domain = { name: "Permit2", chainId: MEZO_CHAIN_ID, verifyingContract: PERMIT2 } as const;

    // 1) Verify the user's Permit2 signature off-chain before spending gas.
    const valid = await verifyTypedData({
      address: owner as `0x${string}`,
      domain,
      types: PERMIT_TYPES,
      primaryType: "PermitTransferFrom",
      message,
      signature: signature as `0x${string}`,
    });
    if (!valid) return json({ error: "Permit2 signature verification failed" }, 400);

    // 2) Settle on-chain from the facilitator wallet — facilitator pays the gas.
    const account = privateKeyToAccount(facilitatorKey as `0x${string}`);
    const chain = {
      id: MEZO_CHAIN_ID,
      name: "Mezo Testnet",
      nativeCurrency: { name: "BTC", symbol: "BTC", decimals: 18 },
      rpcUrls: { default: { http: [RPC] } },
    } as const;
    const wallet = createWalletClient({ account, chain, transport: http(RPC) });
    const publicClient = createPublicClient({ chain, transport: http(RPC) });

    const { request } = await publicClient.simulateContract({
      address: X402_PERMIT2_PROXY,
      abi: PROXY_ABI,
      functionName: "settle",
      args: [
        {
          permitted: { token: MUSD, amount: PRICE_ATOMIC },
          nonce: BigInt(nonce),
          deadline: BigInt(deadline),
        },
        owner as `0x${string}`,
        PAYEE,
        PRICE_ATOMIC,
        signature as `0x${string}`,
      ],
      account,
    });

    // 3x gas multiplier — Mezo eth_estimateGas omits the EIP-7623 calldata floor.
    const gas = await publicClient.estimateContractGas(request);
    const hash = await wallet.writeContract({ ...request, gas: (gas * 3n) / 1n });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return json({
      settled: receipt.status === "success",
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      sponsoredBy: account.address,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Settlement failed" }, 500);
  }
});
