import { beforeEach, describe, expect, it } from "vitest";
import { createSellerService, readSellerServices, sellerServiceTemplates, usesSolidityInput } from "./sellerServices";

beforeEach(() => localStorage.clear());

describe("seller services", () => {
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

import { mergeDeployedServices as mergeDeployed } from "./sellerServices";

describe("mergeDeployedServices", () => {
  it("restores a wallet's deployed services missing from this browser", () => {
    const merged = mergeDeployed([], [{
      listing_id: "0xabc:1700000000000", seller_address: "0xABC", template_id: "contract-review",
      title: "Review", category: "Security", description: "d", endpoint: "/api/review", deployed_at: "2026-01-01T00:00:00Z",
    }]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ listingId: "0xabc:1700000000000", sellerAddress: "0xabc", createdAt: 1700000000000, id: "contract-review" });
  });

  it("does not duplicate services already stored in the browser", () => {
    const local = [{ id: "text-summarizer", title: "Local", category: "c", description: "d", endpoint: "/e", listingId: "0xabc:1", sellerAddress: "0xabc", createdAt: 1 }];
    const merged = mergeDeployed(local, [{ listing_id: "0xabc:1", seller_address: "0xabc", template_id: "text-summarizer", title: "Remote", category: "c", description: "d", endpoint: "/e", deployed_at: "" }]);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("Local");
  });
});
