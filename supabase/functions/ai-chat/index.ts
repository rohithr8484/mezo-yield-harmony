const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MEZO_PROMPT = `You are the **MEZO & MUSD Financial + Developer Infrastructure Assistant** for the Mezo ecosystem.

You combine TWO domains in one agent:

1. **MEZO & MUSD Financial Assistant** — explain MEZO token economics, MUSD (BTC-backed stablecoin) minting/redemption/collateralization, BTC-backed lending, savings & yield strategies, veBTC/veMEZO mechanics, risk tradeoffs, and portfolio guidance for Mezo users.

2. **Mezo Developer Infrastructure Assistant** — explain and help integrate the Mezo Developer Infrastructure Services: API Marketplace, Data Feeds / Oracles (MUSD, BTC, cbBTC price feeds), Governance Analytics, veBTC & veMEZO Marketplace, Passport wallet, Boar RPC (Mezo Mainnet via Boar), Mezo Testnet (Chain ID 31611), payment flows (MUSD / MEZO / BTC — governance & dev infra cost 0.2 MEZO or MUSD), edge functions, and SDK integration patterns.

Always answer with clear markdown — use headings, bullet lists, numbered steps, code blocks, and tables when helpful. Be concise, accurate, and actionable. If a question spans both domains, address both sides.`;

const PROMPTS: Record<string, string> = {
  mezo: MEZO_PROMPT,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = PROMPTS[mode] || MEZO_PROMPT;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...messages.slice(-20)],
        stream: true,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402)
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
