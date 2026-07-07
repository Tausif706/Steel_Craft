// ════════════════════════════════════════════════════════════════
// supabase/functions/ai-design
//
// POST body: { history: {role:'user'|'assistant', content:string}[], message: string }
//
// Conversational furniture-design builder running on Gemini.
// The LLM only ever does two things: ask a clarifying question, or
// signal "ready". Pricing + the 4 SVG views are always computed by
// deterministic local code (pricing.ts / render.ts) — never by the
// model — so dimensions, price and the SVGs are guaranteed correct
// and ALWAYS get generated once a design is ready (see "Guaranteed
// SVG generation" below).
//
// Deploy:  supabase functions deploy ai-design
// Secret:  supabase secrets set GEMINI_API_KEY=your-gemini-key
//          (Get a key at https://aistudio.google.com/apikey — this
//          must be set as a SUPABASE SECRET, never as a VITE_ var in
//          the frontend .env, or it would ship inside the browser
//          bundle for anyone to read.)
// ════════════════════════════════════════════════════════════════
import { createClient } from 'npm:@supabase/supabase-js@2';
import { normalizeSpec, computePricing, DEFAULT_STEEL_SETTINGS, type SteelPricingSettings } from './pricing.ts';
import { renderAllViews } from './render.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEMINI_MODEL = 'gemini-3.5-flash';

// Hard cap on how many back-and-forth questions we allow before we force
// the model to finalize. This is what makes SVG generation "compulsory":
// no matter how vague the customer's answers are, by this turn count we
// either have a model-produced spec or we build one from defaults — either
// way pricing + render always run and SVGs always come back.
const MAX_QUESTION_TURNS = 5;

const SYSTEM_PROMPT = `You are SteelCraft's senior custom furniture design consultant. SteelCraft manufactures steel almirahs, wardrobes, office desks, storage racks, lockers, beds and school furniture in India.

A customer wants to design custom furniture. Have a short, friendly, focused conversation:
- Ask ONE or TWO clarifying questions per turn (not a long list at once).
- Figure out: furniture type, approximate size (width/height/depth in inches — give typical ranges if they're unsure), number of doors, number of shelves, number of drawers, body color, door color, whether they want a mirror, lock type (none/key/digital), whether they want wheels, and steel gauge (default to standard 0.6mm unless they want heavier 0.8-1mm for industrial use).
- Keep questions conversational and practical, like a furniture showroom expert — not a form.
- Do not ask about price; pricing is computed automatically from the final spec.

You must respond ONLY with a JSON object matching the response schema. Never include markdown, code fences, or any text outside that JSON object.
- While you still need more details, set "status":"asking" and put your next question in "question". Omit "spec".
- Once you have enough information (usually after 2-4 exchanges) — or if asked to finalize — set "status":"ready" and fill in EVERY field of "spec" with your best judgement. Never set status to "ready" without a complete "spec".
- Colors must be valid 6-digit hex codes matching what the customer described (pick a sensible hex for named colors).`;

// Gemini "Schema" object (Google's OpenAPI-3.0 subset) describing the FurnitureSpec.
const SPEC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    type: { type: 'STRING', enum: ['almirah', 'wardrobe', 'desk', 'rack', 'locker', 'bed', 'school', 'other'] },
    label: { type: 'STRING', description: 'short descriptive name, e.g. "3-Door Almirah with Mirror"' },
    widthIn: { type: 'NUMBER' },
    heightIn: { type: 'NUMBER' },
    depthIn: { type: 'NUMBER' },
    doors: { type: 'INTEGER' },
    shelves: { type: 'INTEGER' },
    drawers: { type: 'INTEGER' },
    bodyColor: { type: 'STRING', description: '6-digit hex, e.g. #1B3A5E' },
    doorColor: { type: 'STRING', description: '6-digit hex, e.g. #0F172A' },
    mirror: { type: 'BOOLEAN' },
    lockType: { type: 'STRING', enum: ['none', 'key', 'digital'] },
    wheels: { type: 'BOOLEAN' },
    gaugeMM: { type: 'NUMBER' },
    notes: { type: 'STRING' },
  },
  required: ['type', 'label', 'widthIn', 'heightIn', 'depthIn', 'doors', 'shelves', 'drawers', 'bodyColor', 'doorColor', 'mirror', 'lockType', 'wheels', 'gaugeMM'],
};

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    status: { type: 'STRING', enum: ['asking', 'ready'] },
    question: { type: 'STRING' },
    spec: SPEC_SCHEMA,
  },
  required: ['status'],
};

type LlmTurn = { status: 'asking' | 'ready'; question?: string; spec?: any };

// ─── Gemini API call ─────────────────────────────────────────────────────────
// Two things make this reliable:
// 1. responseMimeType + responseSchema force Gemini to return parseable JSON
//    in the exact shape we need — no more regex-matching a custom tag inside
//    free-form text, which breaks the moment the model adds markdown fences
//    or extra wording around it.
// 2. thinkingConfig is set to the lowest level. Gemini 2.5+/3.x models think
//    by default, and those thinking tokens are deducted from maxOutputTokens
//    — with a low token budget this silently eats the entire response and
//    you get back nothing (this is almost certainly why designs were getting
//    stuck before). Keeping thinking minimal + a generous token budget fixes
//    that for good.
async function callGemini(history: { role: string; content: string }[], forceFinalize: boolean): Promise<LlmTurn> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set. Run: supabase secrets set GEMINI_API_KEY=your-gemini-key');

  let contents = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));

  // Gemini REQUIRES the first turn to be "user".
  while (contents.length > 0 && contents[0].role === 'model') {
    contents = contents.slice(1);
  }
  if (contents.length === 0) {
    throw new Error('No user message found in history.');
  }

  if (forceFinalize) {
    contents = [...contents, {
      role: 'user',
      parts: [{ text: 'We have exchanged enough messages now — please finalize the design. Set status to "ready" and fill in every spec field using your best judgement for anything not explicitly discussed.' }],
    }];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const candidate = data?.candidates?.[0];
  const text: string = candidate?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';

  if (!text) {
    console.error('Gemini raw response (no text):', JSON.stringify(data));
    const reason = candidate?.finishReason ?? 'unknown';
    throw new Error(`Gemini returned an empty response (finishReason: ${reason}) — check API key, quota, or safety filters.`);
  }

  try {
    return JSON.parse(text) as LlmTurn;
  } catch {
    console.error('Gemini returned non-JSON despite schema:', text);
    throw new Error('Gemini returned a response that could not be parsed as JSON.');
  }
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

    const userTurnCount = history.filter(h => h.role === 'user').length;

    let turn = await callGemini(history, false);

    // We've asked enough — force a finalize call so the customer always gets a design.
    if (turn.status !== 'ready' && userTurnCount >= MAX_QUESTION_TURNS) {
      turn = await callGemini(history, true);
    }

    // Absolute safety net: even if the forced call somehow still comes back
    // "asking" (e.g. a transient model hiccup), we don't leave the customer
    // stuck. normalizeSpec() fills in sane defaults for anything missing, so
    // pricing + the SVGs are still generated from whatever partial info we
    // have. This is what makes SVG generation truly non-negotiable.
    if (turn.status !== 'ready' && userTurnCount >= MAX_QUESTION_TURNS) {
      turn = { status: 'ready', spec: turn.spec ?? {} };
    }

    if (turn.status !== 'ready') {
      const question = turn.question ?? "Could you tell me a bit more about what you're looking for?";
      const updatedHistory = [...history, { role: 'assistant', content: question }];
      return new Response(JSON.stringify({
        type: 'question',
        message: question,
        history: updatedHistory,
      }), { headers: { ...CORS_HEADERS, 'content-type': 'application/json' } });
    }

    // ── Design ready: price it and render the spec sheet. Always reached. ──
    const spec = normalizeSpec(turn.spec ?? {});
    const settings = await loadSteelSettings(serviceClient);
    const pricing = computePricing(spec, settings);
    const views = renderAllViews(spec, pricing);

    const designId = crypto.randomUUID();
    const ownerPathSegment = userId ?? 'guest';
    const images = await uploadPreviewImages(serviceClient, ownerPathSegment, designId, views);

    const closingMessage = `Here's your custom ${spec.label}! Estimated price ₹${pricing.estimateMin.toLocaleString('en-IN')}–₹${pricing.estimateMax.toLocaleString('en-IN')} (excl. GST).`;
    const updatedHistory = [...history, { role: 'assistant', content: closingMessage }];

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
      message: closingMessage,
      spec,
      pricing,
      images,
      id: savedDesignId,        // matches AIDesignResult.id — AIBuilder.tsx reads result.id for "Send for Review"
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
