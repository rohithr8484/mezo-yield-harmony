import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { text, length, focus } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const target = length === 'short' ? '2 sentences' : length === 'long' ? '2 paragraphs' : '1 short paragraph';
    const focusDirectives: Record<string, string> = {
      general: '',
      liquidity: 'Focus the summary on liquidity aspects: pool depth, TVL, swap flow, incentive programs and how the text affects MUSD/MEZO liquidity.',
      lending: 'Focus the summary on lending aspects: collateral ratios, LTV, borrow rates, interest and liquidation risk.',
      wallet: 'Focus the summary on wallet behavior: activity patterns, holdings, transfer flow, counterparty and usage patterns.',
      governance: 'Focus the summary on governance aspects: proposals, quorum, voting power, fees and protocol decision impact.',
    };
    const focusDirective = focusDirectives[typeof focus === 'string' ? focus : 'general'] ?? '';
    const key = Deno.env.get('LOVABLE_API_KEY');
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key! },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: `Summarize the user's text in ${target}. ${focusDirective} Then list 3-5 bullet key points. Respond as JSON: {"summary":string,"keyPoints":string[]}` },
          { role: 'user', content: text },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: t }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: unknown;
    try { parsed = JSON.parse(content.replace(/```json|```/g, '').trim()); } catch { parsed = { summary: content, keyPoints: [] }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
