// Boar Blockchain MCP-powered chat agent.
// Connects to https://mcp.boar.network/basic and /advanced via MCP Streamable HTTP,
// exposes tools to the Lovable AI Gateway, and runs a tool-calling loop.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MCP_ENDPOINTS = [
  { name: "basic", url: "https://mcp.boar.network/basic" },
  { name: "advanced", url: "https://mcp.boar.network/advanced" },
];

const SYSTEM_PROMPT = `You are the Boar Blockchain Agent. You answer on-chain questions by calling MCP tools.

Critical rules:
- NEVER ask the user which chain to query. When given an EVM address, ALWAYS call eth_get_balance, mezo_get_balance, AND mezo_testnet_get_balance in parallel and report all three.
- Mezo's native asset is BTC (not ETH). Always label Mezo balances as "BTC".
- Boar's mezo_* tools target Mezo MAINNET. The custom tool mezo_testnet_get_balance targets Mezo Matsnet TESTNET (rpc.test.mezo.org) — use it whenever the user mentions testnet, matsnet, or when mainnet returns 0.
- Resolve ENS names before calling balance/token tools.
- For Bitcoin addresses use the Bitcoin tools.
- For failed EVM tx, fetch the receipt then decode revert via advanced tools.
- Format answers as concise markdown. Show full address in a code block. List each chain on its own line with the formatted amount.`;

type JsonRpcResp = { jsonrpc: "2.0"; id: number | string; result?: any; error?: { code: number; message: string } };

class McpClient {
  url: string;
  name: string;
  sessionId: string | null = null;
  nextId = 1;
  tools: any[] = [];

  constructor(name: string, url: string) {
    this.name = name;
    this.url = url;
  }

  private async rpc(method: string, params: any = {}): Promise<any> {
    const id = this.nextId++;
    const body = { jsonrpc: "2.0", id, method, params };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;

    const resp = await fetch(this.url, { method: "POST", headers, body: JSON.stringify(body) });
    const sid = resp.headers.get("Mcp-Session-Id");
    if (sid) this.sessionId = sid;

    const ct = resp.headers.get("content-type") || "";
    let parsed: JsonRpcResp | null = null;
    if (ct.includes("text/event-stream")) {
      const text = await resp.text();
      for (const line of text.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const data = t.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const obj = JSON.parse(data);
          if (obj.id === id) { parsed = obj; break; }
        } catch { /* ignore */ }
      }
    } else {
      const text = await resp.text();
      if (text) parsed = JSON.parse(text);
    }

    if (!parsed) throw new Error(`MCP ${this.name}: empty response for ${method}`);
    if (parsed.error) throw new Error(`MCP ${this.name} ${method}: ${parsed.error.message}`);
    return parsed.result;
  }

  async init() {
    await this.rpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "lovable-boar-chat", version: "1.0.0" },
    });
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      };
      if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
      await fetch(this.url, {
        method: "POST",
        headers,
        body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      });
    } catch { /* ignore */ }

    const result = await this.rpc("tools/list", {});
    this.tools = result?.tools ?? [];
  }

  async callTool(name: string, args: any) {
    return await this.rpc("tools/call", { name, arguments: args });
  }
}

function sanitizeName(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const clients = MCP_ENDPOINTS.map((e) => new McpClient(e.name, e.url));
    await Promise.all(clients.map(async (c) => {
      try { await c.init(); } catch (e) { console.error(`MCP init ${c.name} failed:`, e); }
    }));

    const toolMap = new Map<string, { client: McpClient; original: string }>();
    const tools: any[] = [];
    for (const c of clients) {
      for (const t of c.tools) {
        const exposed = sanitizeName(`${c.name}__${t.name}`);
        toolMap.set(exposed, { client: c, original: t.name });
        tools.push({
          type: "function",
          function: {
            name: exposed,
            description: (t.description || "").slice(0, 1000),
            parameters: t.inputSchema || { type: "object", properties: {} },
          },
        });
      }
    }

    const MEZO_TESTNET_RPC = "https://rpc.test.mezo.org";
    tools.push({
      type: "function",
      function: {
        name: "mezo_testnet_get_balance",
        description: "Get native BTC balance for an address on Mezo Matsnet TESTNET (rpc.test.mezo.org). Use this whenever Mezo testnet/matsnet is requested or when the mainnet balance is 0. Returns balance in wei (hex + decimal) and BTC.",
        parameters: {
          type: "object",
          properties: { address: { type: "string", pattern: "^0x.*" } },
          required: ["address"],
        },
      },
    });

    console.log(`Loaded ${tools.length} tools (Boar MCP + mezo_testnet_get_balance)`);

    const convo: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    for (let i = 0; i < 6; i++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: convo,
          tools: tools.length ? tools : undefined,
          tool_choice: tools.length ? "auto" : undefined,
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429)
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402)
          return new Response(JSON.stringify({ error: "AI credits exhausted." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await resp.text();
        console.error("AI gateway error:", resp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await resp.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) throw new Error("No message returned");

      const toolCalls = msg.tool_calls || [];
      if (!toolCalls.length) {
        return new Response(JSON.stringify({ content: msg.content || "" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      convo.push(msg);

      for (const call of toolCalls) {
        const fname = call.function?.name;
        const fargs = call.function?.arguments;
        let parsedArgs: any = {};
        try { parsedArgs = typeof fargs === "string" ? JSON.parse(fargs || "{}") : (fargs || {}); }
        catch { parsedArgs = {}; }

        let toolResult = "";
        if (fname === "mezo_testnet_get_balance") {
          try {
            const addr = String(parsedArgs.address || "");
            const r = await fetch(MEZO_TESTNET_RPC, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [addr, "latest"] }),
            });
            const j = await r.json();
            if (j.error) {
              toolResult = JSON.stringify({ error: j.error.message });
            } else {
              const hex = j.result as string;
              const wei = BigInt(hex);
              const btc = Number(wei) / 1e18;
              toolResult = JSON.stringify({
                chain: "Mezo Matsnet Testnet",
                address: addr,
                balanceHex: hex,
                balanceWei: wei.toString(),
                balanceBTC: btc,
                formatted: `${btc.toFixed(8)} BTC`,
              });
            }
          } catch (e) {
            toolResult = JSON.stringify({ error: e instanceof Error ? e.message : String(e) });
          }
        } else {
          const mapping = toolMap.get(fname);
          if (!mapping) {
            toolResult = JSON.stringify({ error: `Unknown tool: ${fname}` });
          } else {
            try {
              const r = await mapping.client.callTool(mapping.original, parsedArgs);
              if (r?.content && Array.isArray(r.content)) {
                toolResult = r.content
                  .map((c: any) => (typeof c?.text === "string" ? c.text : JSON.stringify(c)))
                  .join("\n");
              } else {
                toolResult = JSON.stringify(r);
              }
              if (toolResult.length > 8000) toolResult = toolResult.slice(0, 8000) + "\n…[truncated]";
            } catch (e) {
              toolResult = JSON.stringify({ error: e instanceof Error ? e.message : String(e) });
            }
          }
        }

        convo.push({
          role: "tool",
          tool_call_id: call.id,
          content: toolResult,
        });
      }
    }

    return new Response(JSON.stringify({ content: "I wasn't able to complete the request within the tool-call budget." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("boar-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
