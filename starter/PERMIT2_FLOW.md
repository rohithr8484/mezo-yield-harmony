# x402 Permit2 Flow on Mezo Testnet

Three services that together process one paid API call over x402, using
Permit2 + mUSD on Mezo Testnet (chain id `31611`).

```
client  ──GET /paid──▶  server      (402 + PaymentRequirements)
client  ──sign Permit2 EIP-712──▶  (off-chain, no gas)
client  ──GET /paid + X-PAYMENT──▶  server
                            │
                            ├─ POST /verify  ─▶ facilitator (recover signer)
                            └─ POST /settle  ─▶ facilitator ──▶ x402Permit2Proxy.settle()
                                                                 └─▶ Permit2.permitTransferFrom()
                                                                       └─▶ mUSD.transferFrom(client → payee)
server  ──200 OK + joke + X-PAYMENT-RESPONSE (txHash) ──▶ client
```

## Contracts

| Role                 | Address                                                                  |
|----------------------|--------------------------------------------------------------------------|
| Permit2              | `0x000000000022D473030F116dDEE9F6B43aC78BA3`                              |
| x402Permit2Proxy     | `0x8dea1b08dc2e1D9b556450f736F19968F367A98d`                              |
| mUSD                 | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`                              |

## Wallets

| Wallet      | Purpose                                | Funding needed                       |
|-------------|----------------------------------------|--------------------------------------|
| Facilitator | Submits `settle()` transactions        | Testnet BTC (gas)                    |
| Payee       | Receives mUSD payments                 | None                                 |
| Client      | Signs Permit2 authorizations           | Testnet mUSD + BTC (one-time approve)|

## One-time: approve Permit2

The Permit2 contract must be approved to pull mUSD from the client. Standard
ERC-20 `approve()`, one transaction, costs a small amount of testnet BTC.

```bash
cast send 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 \
  "approve(address,uint256)" \
  0x000000000022D473030F116dDEE9F6B43aC78BA3 \
  $(cast max-uint) \
  --private-key $CLIENT_PRIVATE_KEY \
  --rpc-url https://rpc.test.mezo.org
```

After this, every x402 payment is off-chain Permit2 signing + on-chain
`transferFrom` via the proxy. No more ERC-20 approvals.

## Run

```bash
# Terminal 1 — facilitator (verifies & settles)
cd starter/facilitator && cp .env.example .env  # fill FACILITATOR_PRIVATE_KEY
pnpm install && npx tsx facilitator.ts
# Listening on :4022

# Terminal 2 — humor server (paywall)
cd starter/server && cp .env.example .env  # fill PAYEE_ADDRESS
pnpm install && npx tsx humor-server.ts
# Listening on :3000

# Terminal 3 — client (pays for a joke)
cd starter/client && cp .env.example .env  # fill CLIENT_PRIVATE_KEY
pnpm install && npx tsx client.ts
```

Expected client output:

```
client=0xClient…  →  http://localhost:3000/paid
✓ Permit2 allowance: 11579208923…
402 Payment Required → 1000000000000000 (atomic) of 0x118917…03 → 0xPayee…
Signed Permit2 (nonce=0xa3f9…) — retrying with X-PAYMENT

200 OK
Body:    { joke: { setup: "...", punchline: "..." }, settlement: { txHash: "0x…", payer: "0xClient…" } }
Receipt: { txHash: "0x…", payer: "0xClient…" }
```

## Mezo gas note

Mezo's `eth_estimateGas` currently omits the EIP-7623 calldata floor, so
`Permit2.settle()` underestimates and reverts. The facilitator applies a
3× multiplier as a workaround (`GAS_MULTIPLIER=3`). Tracked upstream.
