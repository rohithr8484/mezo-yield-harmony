/** Extract declarations from a parsed Solidity AST, never from comments or call sites. */
export function functionInventory(ast: unknown, source: string) {
  const functions: { name: string; contract: string; declaration: string }[] = [];
  function walk(value: unknown, contract = "Source file") {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, contract));
      return;
    }
    const node = value as Record<string, unknown>;
    const owner = node.type === "ContractDefinition" && typeof node.name === "string" ? node.name : contract;
    if (node.type === "FunctionDefinition") {
      const name = node.isConstructor ? "constructor" : node.isReceiveEther ? "receive" : node.isFallback ? "fallback" : node.name;
      if (typeof name === "string") {
        const range = node.range;
        const declaration = Array.isArray(range) && typeof range[0] === "number" && typeof range[1] === "number"
          ? source.slice(range[0], range[1] + 1) : name;
        functions.push({ name, contract: owner, declaration });
      }
    }
    Object.values(node).forEach((child) => walk(child, owner));
  }
  walk(ast);
  return functions;
}