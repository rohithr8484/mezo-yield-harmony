import { describe, expect, it } from "vitest";
import { getMarketplaceAdminArgs, MARKETPLACE_ADMIN_ACTIONS } from "./marketplaceAdminActions";

const input = { account: "0x2Db34b3aBb62Ffcfe7F6927Cfa4F52C16D649694", collection: "0xaCE816CA2bcc9b12C59799dcC5A959Fb9b98111b" };
describe("MarketplaceAdmin action mapping", () => {
  it("maps Get Role to grantRole and marks only three actions as writes", () => {
    expect(MARKETPLACE_ADMIN_ACTIONS.find((action) => action.label === "Get Role")?.id).toBe("grantRole");
    expect(MARKETPLACE_ADMIN_ACTIONS.filter((action) => action.write).map((action) => action.id)).toEqual(["grantRole", "addCollection", "removeCollection"]);
  });
  it("passes the chosen role and target wallet to role calls", () => {
    expect(getMarketplaceAdminArgs("grantRole", input, "0x1234")).toEqual(["0x1234", input.account]);
    expect(getMarketplaceAdminArgs("hasRole", input, "0x1234")).toEqual(["0x1234", input.account]);
  });
  it("passes a collection address to each collection call, including the mapping getter", () => {
    for (const action of ["supportedCollections", "addCollection", "removeCollection", "isCollectionSupported"] as const) {
      expect(getMarketplaceAdminArgs(action, input)).toEqual([input.collection]);
    }
  });
  it("rejects malformed and zero addresses before submission", () => {
    expect(() => getMarketplaceAdminArgs("addCollection", { ...input, collection: "invalid" })).toThrow("valid nonzero");
    expect(() => getMarketplaceAdminArgs("grantRole", { ...input, account: "0x0000000000000000000000000000000000000000" }, "0x1234")).toThrow("valid nonzero");
  });
});