import { beforeEach, describe, expect, it } from "vitest";
import { createSellerService, mergeSellerServices, readSellerServices, SELLER_SERVICES_KEY, sellerServiceTemplates, usesSolidityInput } from "./sellerServices";

beforeEach(() => localStorage.clear());

describe("seller services", () => {
  const row = {
    listing_id: "0xabc123:2000", seller_address: "0xabc123", template_id: "contract-function-viewer",
    title: "My viewer", category: "Developer / Contracts", description: "Function descriptions",
    endpoint: "/api/functions", deployed_at: "2026-11-14T17:00:00Z",
  };
  it("restores deployed services for the wallet even when browser listings are missing", () => {
    const restored = mergeSellerServices([], [row], "0xABC123");
    localStorage.setItem(SELLER_SERVICES_KEY, JSON.stringify(restored));
    expect(readSellerServices()).toHaveLength(1);
    expect(readSellerServices()[0]).toMatchObject({ listingId: row.listing_id, sellerAddress: "0xabc123", title: "My viewer" });
  });
  it("keeps pending and other-wallet listings without duplicating restored services", () => {
    const pending = createSellerService(sellerServiceTemplates[0], "0xabc123", localStorage, 1000);
    const other = createSellerService(sellerServiceTemplates[0], "0xdef456", localStorage, 1001);
    const restored = mergeSellerServices(readSellerServices(), [row], "0xabc123");
    expect(mergeSellerServices(restored, [row], "0xabc123")).toHaveLength(3);
    expect(restored.map((service) => service.listingId)).toContain(pending.listingId);
    expect(restored.map((service) => service.listingId)).toContain(other.listingId);
    expect(mergeSellerServices([], [row], "0xdef456")).toEqual([]);
  });
  it("stores a created service with the connected wallet address", () => {
    createSellerService(sellerServiceTemplates[0], "0xAbC123", localStorage, 1000);
    const [service] = readSellerServices();
    expect(service.sellerAddress).toBe("0xabc123");
    expect(service.title).toBe("AI Text Summarization");
    expect(service.createdAt).toBe(1000);
  });

  it("does not create a service without a wallet address", () => {
    expect(() => createSellerService(sellerServiceTemplates[0], "", localStorage, 1000)).toThrow(
      "Connect a wallet before publishing a service.",
    );
    expect(readSellerServices()).toEqual([]);
  });
});
describe("seller templates", () => {
  it("does not offer the Custom Developer API template", () => {
    expect(sellerServiceTemplates.map((t) => t.title)).not.toContain("Custom Developer API");
    expect(sellerServiceTemplates).toHaveLength(4);
  });
  it("uses the same Solidity inputs for review and function viewer, not summarization", () => {
    expect(usesSolidityInput("contract-review")).toBe(true);
    expect(usesSolidityInput("contract-function-viewer")).toBe(true);
    expect(usesSolidityInput("text-summarizer")).toBe(false);
  });
  it("publishes the function viewer separately from contract review", () => {
    const template = sellerServiceTemplates.find((item) => item.id === "contract-function-viewer");
    if (!template) throw new Error("Missing function viewer template");
    createSellerService(template, "0xAbC123", localStorage, 1000);
    expect(readSellerServices()[0]).toMatchObject({ id: "contract-function-viewer", endpoint: "/api/functions" });
    expect(sellerServiceTemplates.find((item) => item.id === "contract-review")?.endpoint).toBe("/api/review");
  });
});
