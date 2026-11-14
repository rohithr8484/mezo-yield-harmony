import { describe, expect, it } from "vitest";
import { parse } from "@solidity-parser/parser";
import { functionInventory } from "../../supabase/functions/seller-services/functionInventory";

describe("contract function viewer inventory", () => {
  it("lists every declared function including internal functions and overloads, not comments or calls", () => {
    const source = `pragma solidity ^0.8.24;
      contract Vault {
        // function fake() external {}
        constructor() {}
        receive() external payable {}
        fallback() external payable {}
        function deposit(uint amount) external { helper(); }
        function deposit() public {}
        function helper() internal pure {}
      }
      interface Reader { function balance() external view returns (uint); }`;
    expect(functionInventory(parse(source, { range: true }), source).map(({ name, contract }) => [contract, name])).toEqual([
      ["Vault", "constructor"], ["Vault", "receive"], ["Vault", "fallback"],
      ["Vault", "deposit"], ["Vault", "deposit"], ["Vault", "helper"], ["Reader", "balance"],
    ]);
  });
  it("keeps function bodies as evidence for descriptions", () => {
    const source = "contract Store { uint n; function set(uint value) external { n = value; } }";
    const result = functionInventory(parse(source, { range: true }), source);
    expect(result[0].declaration).toBe("function set(uint value) external { n = value; }");
  });
});