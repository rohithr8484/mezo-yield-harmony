import { defineChain } from "viem";

export const mezoTestnet = defineChain({
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: {
    name: "Bitcoin",
    symbol: "BTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.test.mezo.org"],
      webSocket: ["wss://rpc-ws.test.mezo.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mezo Testnet Explorer",
      url: "https://explorer.test.mezo.org",
    },
  },
  testnet: true,
});

export const mezoMainnet = defineChain({
  id: 31612,
  name: "Mezo",
  nativeCurrency: {
    name: "Bitcoin",
    symbol: "BTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-http.mezo.boar.network"],
      webSocket: ["wss://rpc-ws.mezo.boar.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mezo Explorer",
      url: "https://explorer.mezo.org",
    },
  },
});

// Contract addresses
export const CONTRACTS = {
  testnet: {
    MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as `0x${string}`,
    BTC: "0x7b7C000000000000000000000000000000000000" as `0x${string}`,
  },
  mainnet: {
    MUSD: "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186" as `0x${string}`,
    BTC: "0x7b7C000000000000000000000000000000000000" as `0x${string}`,
    POOL_FACTORY: "0x83FE469C636C4081b87bA5b3Ae9991c6Ed104248" as `0x${string}`,
    MUSD_BTC_POOL: "0x52e604c44417233b6CcEDDDc0d640A405Caacefb" as `0x${string}`,
  },
} as const;

// ERC20 ABI (minimal)
export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
