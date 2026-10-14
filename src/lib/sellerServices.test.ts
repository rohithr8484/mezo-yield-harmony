import { beforeEach, describe, expect, it } from "vitest";
import { createSellerService, readSellerServices, sellerServiceTemplates } from "./sellerServices";

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