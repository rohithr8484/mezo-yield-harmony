export const SELLER_SERVICES_KEY = "developer_seller_services_v1";

export type SellerServiceTemplate = {
  id: string;
  title: string;
  category: string;
  description: string;
  endpoint: string;
};

export type SellerService = SellerServiceTemplate & {
  listingId: string;
  sellerAddress: string;
  createdAt: number;
};

export const sellerServiceTemplates: SellerServiceTemplate[] = [
  {
    id: "text-summarizer",
    title: "AI Text Summarization",
    category: "AI / Language",
    description: "Turn long text into a concise summary and key points.",
    endpoint: "/api/summarize",
  },
  {
    id: "wallet-analytics",
    title: "On-chain Analytics",
    category: "Data / On-chain",
    description: "Return transaction and wallet observations for a supplied Mezo address.",
    endpoint: "/api/analyze",
  },
  {
    id: "contract-review",
    title: "Smart Contract Review",
    category: "Security / Contracts",
    description: "Review Solidity source for common risks and return a structured report.",
    endpoint: "/api/review",
  },
  {
    id: "contract-function-viewer",
    title: "Smart Contract Function Viewer",
    category: "Developer / Contracts",
    description: "Display all function names in Solidity source with a simple description of each function.",
    endpoint: "/api/functions",
  },
];

export function usesSolidityInput(templateId: string): boolean {
  return templateId === "contract-review" || templateId === "contract-function-viewer";
}

export type StoredSellerService = {
  listing_id: string;
  seller_address: string;
  template_id: string;
  title: string;
  category: string;
  description: string;
  endpoint: string;
  deployed_at: string;
};

/** Restore wallet listings from the registry while keeping local pending listings. */
export function mergeSellerServices(local: SellerService[], rows: StoredSellerService[], wallet: string): SellerService[] {
  const owner = wallet.toLowerCase();
  const merged = new Map(local.map((service) => [service.listingId, service]));
  for (const row of rows) {
    if (row.seller_address.toLowerCase() !== owner) continue;
    merged.set(row.listing_id, {
      id: row.template_id,
      listingId: row.listing_id,
      sellerAddress: owner,
      title: row.title,
      category: row.category,
      description: row.description,
      endpoint: row.endpoint,
      createdAt: merged.get(row.listing_id)?.createdAt ?? Date.parse(row.deployed_at),
    });
  }
  return [...merged.values()].sort((a, b) => b.createdAt - a.createdAt);
}

/** Message the seller wallet signs to deploy a listing. Must match the backend function. */
export function buildDeployMessage(s: {
  listingId: string;
  title: string;
  endpoint: string;
  sellerAddress: string;
  signedAt: number;
}) {
  return [
    "Deploy Mezo seller service",
    `Listing: ${s.listingId}`,
    `Title: ${s.title}`,
    `Endpoint: ${s.endpoint}`,
    `Seller: ${s.sellerAddress.toLowerCase()}`,
    `Signed at: ${s.signedAt}`,
  ].join("\n");
}

export function readSellerServices(storage: Pick<Storage, "getItem"> = window.localStorage): SellerService[] {
  try {
    const parsed = JSON.parse(storage.getItem(SELLER_SERVICES_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SellerService =>
      typeof item?.listingId === "string" &&
      typeof item?.sellerAddress === "string" &&
      typeof item?.title === "string" &&
      typeof item?.description === "string",
    );
  } catch {
    return [];
  }
}

export function createSellerService(
  service: Omit<SellerService, "listingId" | "createdAt" | "sellerAddress">,
  sellerAddress: string,
  storage: Pick<Storage, "getItem" | "setItem"> = window.localStorage,
  now = Date.now(),
): SellerService {
  const normalizedAddress = sellerAddress.trim().toLowerCase();
  if (!normalizedAddress) throw new Error("Connect a wallet before publishing a service.");

  const title = service.title.trim();
  const description = service.description.trim();
  const endpoint = service.endpoint.trim();
  if (!title || !description || !endpoint) throw new Error("Complete every service field before publishing.");

  const listing: SellerService = {
    ...service,
    title,
    description,
    endpoint,
    sellerAddress: normalizedAddress,
    createdAt: now,
    listingId: `${normalizedAddress}:${now}`,
  };
  storage.setItem(SELLER_SERVICES_KEY, JSON.stringify([listing, ...readSellerServices(storage)]));
  return listing;
}
