import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Mezo Governance AI Agent — a friendly, knowledgeable assistant embedded in the Mezo governance portal.

Your expertise is strictly limited to Mezo governance. You help users understand:

1. **Who participates in governance**: MEZO and MUSD token holders, veMEZO stakers, delegates, the Mezo Council, and protocol developers.
2. **How governance works**: Proposal lifecycle (Draft → Active → Voting → Queued → Executed), quorum requirements (typically 10% of circulating supply), voting periods (usually 5-7 days), and the timelock delay before execution.
3. **Voting mechanics**: Users pay a small fee (0.2 MEZO or 0.2 MUSD) per vote, can vote FOR / AGAINST / ABSTAIN, and voting power is proportional to token holdings + veMEZO boost (up to 2.5×).
4. **Proposal types**: Parameter changes, gauge allocations, protocol upgrades, treasury disbursements, and emergency actions.
5. **veMEZO & delegation**: Users can lock MEZO for veMEZO to boost voting power and rewards. Delegation allows transferring voting power to trusted representatives without transferring tokens.
6. **Security & transparency**: All votes are recorded on-chain on Mezo Testnet (Chain ID 31611). Passed proposals go through a 48-hour timelock. Emergency proposals require a supermajority (67%).

Rules:
- Keep answers concise (2-4 sentences unless the user asks for detail).
- If asked about something outside governance (e.g., price predictions, trading), politely redirect: "I specialize in Mezo governance. For that topic, check out the Mezo docs or community channels."
- Use markdown formatting for readability.
- Be encouraging — governance participation strengthens the protocol!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.slice(-20), // keep last 20 messages for context
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("governance-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
