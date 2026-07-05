// Uploads a GCash payment screenshot to the online-order-payments bucket on behalf of the
// public (anon) order-online.html page.
//
// Why this exists: the anon role has no direct write access to the storage schema (a
// platform-level security hardening that InsForge actively re-enforces — granting it back
// via SQL gets silently reverted). Uploads for this public, unauthenticated flow must
// instead go through a server-side function that authenticates with the project's admin
// API_KEY secret, which the storage service accepts as an elevated bearer token.
//
// Body: { fileName: string, mimeType: string, dataBase64: string }

export default async function (req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const baseUrl = Deno.env.get('INSFORGE_BASE_URL');
  const apiKey = Deno.env.get('API_KEY');
  if (!baseUrl || !apiKey) {
    return new Response(JSON.stringify({ error: 'Storage upload not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let body: { fileName?: string; mimeType?: string; dataBase64?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { fileName, mimeType, dataBase64 } = body;
  if (!fileName || !dataBase64) {
    return new Response(JSON.stringify({ error: 'fileName and dataBase64 are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Guardrails: this is a public, unauthenticated endpoint backed by an admin key, so it
  // must stay scoped to "small image screenshot" and reject everything else outright.
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB
  if (!mimeType || !mimeType.startsWith('image/')) {
    return new Response(JSON.stringify({ error: 'Only image uploads are allowed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  // Base64 length is a safe upper-bound proxy for decoded size (decoded is smaller), cheap
  // to check before doing the actual decode.
  if (dataBase64.length > Math.ceil(MAX_BYTES / 3) * 4) {
    return new Response(JSON.stringify({ error: 'File too large (max 5MB)' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const bytes = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0));
    if (bytes.length > MAX_BYTES) {
      return new Response(JSON.stringify({ error: 'File too large (max 5MB)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const blob = new Blob([bytes], { type: mimeType });

    const form = new FormData();
    form.append('file', blob, fileName);

    const uploadRes = await fetch(`${baseUrl}/api/storage/buckets/online-order-payments/objects`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      return new Response(JSON.stringify({ error: uploadData?.message || 'Upload failed' }), {
        status: uploadRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = uploadData.url?.startsWith('http') ? uploadData.url : `${baseUrl}${uploadData.url}`;
    return new Response(JSON.stringify({ url, key: uploadData.key }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
