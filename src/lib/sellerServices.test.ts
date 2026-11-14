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
