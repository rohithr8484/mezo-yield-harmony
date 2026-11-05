import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fee: vi.fn(), collection: vi.fn(), contract: vi.fn() }));
vi.mock("ethers", () => ({
  JsonRpcProvider: vi.fn(),
  Contract: vi.fn(function (...args: unknown[]) {
    mocks.contract(...args);
    return { FEE_TIMELOCK: mocks.fee, isCollectionSupported: mocks.collection };
  }),
}));

import { readMarketplaceCollectionSupported, readMarketplaceFeeTimelock } from "./marketplaceAdminReads";

describe("MarketplaceAdmin read-only controls", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads FEE_TIMELOCK from the requested admin contract", async () => {
    mocks.fee.mockResolvedValue(172800n);
    expect(await readMarketplaceFeeTimelock()).toBe(172800n);
    expect(mocks.fee).toHaveBeenCalledWith();
    expect(mocks.contract.mock.calls[0][0]).toBe("0x1D462522A9f8fbea6c10122dce01E09432A64dBF");
  });

  it("checks the specified veMEZO collection and preserves a false result", async () => {
    mocks.collection.mockResolvedValue(false);
    expect(await readMarketplaceCollectionSupported()).toBe(false);
    expect(mocks.collection).toHaveBeenCalledWith("0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b");
    expect(mocks.contract.mock.calls[0][0]).toBe("0x1D462522A9f8fbea6c10122dce01E09432A64dBF");
  });
});