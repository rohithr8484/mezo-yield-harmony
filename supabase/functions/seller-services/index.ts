import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyMessage } from 'npm:viem@2';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const MAX_SIGNATURE_AGE_MS = 10 * 60 * 1000;

// Must match buildDeployMessage in src/lib/sellerServices.ts
function buildDeployMessage(s: { listingId: string; title: string; endpoint: string; sellerAddress: string; signedAt: number }) {
  return [
    'Deploy Mezo seller service',
    `Listing: ${s.listingId}`,
    `Title: ${s.title}`,
    `Endpoint: ${s.endpoint}`,
    `Seller: ${s.sellerAddress}`,
    `Signed at: ${s.signedAt}`,
  ].join('\n');
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const templatePrompts: Record<string, string> = {
  'text-summarizer': 'Summarize the input in one short paragraph, then list 3 key points.',
  'wallet-analytics': 'The input is a Mezo wallet or transaction reference. Explain what observations would be collected and what cannot be concluded without explorer data. Never claim safety or compliance.',
  'contract-review': 'Review the supplied Solidity for common risks (reentrancy, access control, unchecked calls, overflow). Return a short structured report. State that this is not an audit.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const body = await req.json();
    const action = body?.action;

    if (action === 'deploy') {
      const listingId = str(body.listingId, 120);
      const sellerAddress = str(body.sellerAddress, 42).toLowerCase();
      const templateId = str(body.templateId, 40) || 'custom-api';
      const title = str(body.title, 80);
      const category = str(body.category, 60) || 'Developer Tool';
      const description = str(body.description, 280);
      const endpoint = str(body.endpoint, 160);
      const signedAt = Number(body.signedAt);
      const signature = str(body.signature, 300);

      if (!/^0x[0-9a-f]{40}$/.test(sellerAddress)) return json({ error: 'A valid seller wallet is required.' }, 400);
      if (!listingId || !title || !description || !endpoint || !signature) return json({ error: 'Complete every service field before deploying.' }, 400);
      if (!Number.isFinite(signedAt) || Math.abs(Date.now() - signedAt) > MAX_SIGNATURE_AGE_MS) return json({ error: 'The wallet signature expired. Please sign again.' }, 400);
      if (!listingId.startsWith(`${sellerAddress}:`)) return json({ error: 'This listing belongs to a different wallet.' }, 403);

      const valid = await verifyMessage({
        address: sellerAddress as `0x${string}`,
        message: buildDeployMessage({ listingId, title, endpoint, sellerAddress, signedAt }),
        signature: signature as `0x${string}`,
      }).catch(() => false);
      if (!valid) return json({ error: 'The wallet signature does not match the seller address.' }, 403);

      const { data, error } = await supabase
        .from('seller_services')
        .upsert({ listing_id: listingId, seller_address: sellerAddress, template_id: templateId, title, category, description, endpoint }, { onConflict: 'listing_id' })
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ service: data });
    }

    if (action === 'invoke') {
      const id = str(body.id, 60);
      const input = str(body.input, 4000);
      if (!id || !input) return json({ error: 'id and input are required.' }, 400);
      const { data: service } = await supabase.from('seller_services').select('*').eq('id', id).maybeSingle();
      if (!service) return json({ error: 'Service not found or not deployed.' }, 404);

      const instruction = templatePrompts[service.template_id] ?? `You are the developer service "${service.title}": ${service.description}. Respond to the input concisely.`;
      const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': Deno.env.get('LOVABLE_API_KEY')!, 'X-Lovable-AIG-SDK': 'fetch' },
        body: JSON.stringify({
          model: 'openai/gpt-6-astra',
          input: [{ role: 'system', content: instruction }, { role: 'user', content: input }],
          reasoning: { effort: 'low' },
          store: false,
          stream: true,
        }),
      });
      if (res.status === 429) return json({ error: 'Too many requests, please try again shortly.' }, 429);
      if (res.status === 402) return json({ error: 'AI credits are exhausted for this workspace.' }, 402);
      if (!res.ok || !res.body) return json({ error: 'The service could not respond.' }, 502);
      let output = '';
      let buffer = '';
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const event = JSON.parse(payload);
            if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') output += event.delta;
          } catch { /* ignore partial */ }
        }
      }
      return json({ service: service.title, output });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
