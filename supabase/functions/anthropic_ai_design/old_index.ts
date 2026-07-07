// ════════════════════════════════════════════════════════════════
// supabase/functions/ai-design
//
// POST body: { history: {role:'user'|'assistant', content:string}[], message: string }
//
// Conversational furniture-design builder. Keeps asking focused
// questions until it has enough detail, then returns a computed
// price + 4 rendered spec-sheet images (front/side/top/inside).
// No external image-generation API is used — images are drawn
// deterministically from the structured spec so dimensions and
// price are always exactly right (see render.ts).
//
// Deploy:  supabase functions deploy ai-design
// Secret:  supabase secrets set GEMINI_API_KEY=sk-ant-...
// ════════════════════════════════════════════════════════════════
import { createClient } from 'npm:@supabase/supabase-js@2';
import { normalizeSpec, computePricing, DEFAULT_STEEL_SETTINGS, type SteelPricingSettings } from './pricing.ts';
import { renderAllViews } from './render.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are SteelCraft's senior custom furniture design consultant. SteelCraft manufactures steel almirahs, wardrobes, office desks, storage racks, lockers, beds and school furniture in India.

A customer wants to design custom furniture. Have a short, friendly, focused conversation:
- Ask ONE or TWO clarifying questions per turn (not a long list at once).
- Figure out: furniture type, approximate size (width/height/depth in inches — give typical ranges if they're unsure), number of doors, number of shelves, number of drawers, body color, door color, whether they want a mirror, lock type (none/key/digital), whether they want wheels, and steel gauge (default to standard 0.6mm unless they want heavier 0.8-1mm for industrial use).
- Keep questions conversational and practical, like a furniture showroom expert — not a form.
- Do not ask about price; pricing is computed automatically from the final spec.
- Once you have enough information (usually after 2-4 exchanges), respond with ONLY this, no other text:
<design_complete>{"type":"almirah","label":"short descriptive name","widthIn":36,"heightIn":72,"depthIn":18,"doors":3,"shelves":3,"drawers":0,"bodyColor":"#1B3A5E","doorColor":"#0F172A","mirror":false,"lockType":"key","wheels":false,"gaugeMM":0.6,"notes":"any special requirements"}</design_complete>
Colors must be valid 6-digit hex codes matching what the customer described (pick a sensible hex for named colors). "type" must be one of: almirah, wardrobe, desk, rack, locker, bed, school, other.`;

function extractDesignBlock(text: string): any | null {
  const match = text.match(/<design_complete>([\s\S]*?)<\/design_complete>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

async function callClaude(history: { role: string; content: string }[]) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on this Edge Function');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: history.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Anthropic API error (${resp.status}): ${errText}`);
  }
  const data = await resp.json();
  const text = (data.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');
  return text;
}

async function loadSteelSettings(serviceClient: any): Promise<SteelPricingSettings> {
  const { data } = await serviceClient.from('app_settings').select('value').eq('key', 'steel_pricing').maybeSingle();
  if (data?.value) return { ...DEFAULT_STEEL_SETTINGS, ...data.value };
  return DEFAULT_STEEL_SETTINGS;
}

async function uploadPreviewImages(serviceClient: any, ownerId: string, designId: string, views: Record<string, string>) {
  const urls: Record<string, string> = {};
  for (const [name, svg] of Object.entries(views)) {
    const path = `${ownerId}/${designId}/${name}.svg`;
    const { error } = await serviceClient.storage.from('design-previews').upload(path, new Blob([svg], { type: 'image/svg+xml' }), {
      contentType: 'image/svg+xml',
      upsert: true,
    });
    if (error) throw new Error(`Storage upload failed for ${name}: ${error.message}`);
    const { data } = serviceClient.storage.from('design-previews').getPublicUrl(path);
    urls[name] = data.publicUrl;
  }
  return urls;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const body = await req.json();
    const incomingHistory: { role: string; content: string }[] = Array.isArray(body.history) ? body.history : [];
    const message: string = body.message ?? '';
    const history = [...incomingHistory, { role: 'user', content: message }];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    // user-scoped client (forwards the caller's JWT so RLS applies normally)
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData?.user?.id ?? null;

    const assistantText = await callClaude(history);
    const updatedHistory = [...history, { role: 'assistant', content: assistantText }];

    const rawSpec = extractDesignBlock(assistantText);

    if (!rawSpec) {
      // still gathering requirements
      return new Response(JSON.stringify({
        type: 'question',
        message: assistantText,
        history: updatedHistory,
      }), { headers: { ...CORS_HEADERS, 'content-type': 'application/json' } });
    }

    // ── Design complete: price it and render the spec sheet ──
    const spec = normalizeSpec(rawSpec);
    const settings = await loadSteelSettings(serviceClient);
    const pricing = computePricing(spec, settings);
    const views = renderAllViews(spec, pricing);

    const designId = crypto.randomUUID();
    const ownerPathSegment = userId ?? 'guest';
    const images = await uploadPreviewImages(serviceClient, ownerPathSegment, designId, views);

    let savedDesignId: string | null = null;
    if (userId) {
      const { data: inserted, error } = await userClient.from('ai_designs').insert({
        id: designId,
        user_id: userId,
        conversation: updatedHistory,
        prompt: incomingHistory.find(h => h.role === 'user')?.content ?? message,
        generated_spec: spec,
        estimated_min: pricing.estimateMin,
        estimated_max: pricing.estimateMax,
        price_breakdown: pricing,
        preview_images: [images.front, images.side, images.top, images.inside],
        status: 'completed',
      }).select('id').single();
      if (!error) savedDesignId = inserted.id;
    }

    return new Response(JSON.stringify({
      type: 'complete',
      message: `Here's your custom ${spec.label}! Estimated price ₹${pricing.estimateMin.toLocaleString('en-IN')}–₹${pricing.estimateMax.toLocaleString('en-IN')} (excl. GST).`,
      spec,
      pricing,
      images,
      designId: savedDesignId,
      savedToAccount: !!savedDesignId,
      history: updatedHistory,
    }), { headers: { ...CORS_HEADERS, 'content-type': 'application/json' } });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ type: 'error', message: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    });
  }
});
