// Sends a Telegram message to the shop owner(s) whenever a new Cup of Joy online order comes in.
// Secrets: TELEGRAM_BOT_TOKEN (bot API token), TELEGRAM_CHAT_IDS (comma-separated chat IDs).
// Invoked from order-online.html via insforge.functions.invoke('notify-telegram', { body: {...} })

export default async function (req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatIds = (Deno.env.get('TELEGRAM_CHAT_IDS') || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  if (!botToken || !chatIds.length) {
    return new Response(JSON.stringify({ error: 'Telegram not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let order: Record<string, unknown>;
  try {
    order = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const money = (n: unknown) => `₱${(Number(n) || 0).toFixed(2)}`;
  const lines = [
    `☕ *New Cup of Joy Online Order*`,
    `Order #${order.order_number}`,
    ``,
    `*Customer:* ${order.customer_name}`,
    `*Mobile:* ${order.mobile_number}`,
    `*Type:* ${order.order_type}`,
    `*Scheduled:* ${order.scheduled_time}`,
    order.order_type === 'Delivery' ? `*Barangay:* ${order.barangay}` : null,
    ``,
    `*Items:*`,
    String(order.items || ''),
    ``,
    `*Subtotal:* ${money(order.subtotal)}`,
    order.order_type === 'Delivery' ? `*Delivery Fee:* ${money(order.delivery_fee)}` : null,
    `*Grand Total:* ${money(order.grand_total)}`,
    `*Payment:* ${order.payment_method}`,
    order.payment_method === 'GCash' ? `*GCash Reference:* ${order.gcash_reference}` : null,
    ``,
    `Go to your Owner Dashboard to confirm this order.`
  ].filter(Boolean).join('\n');

  const results = await Promise.all(chatIds.map(async chatId => {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: 'Markdown' })
    });
    const data = await res.json();
    return { chatId, ok: res.ok && data.ok, data };
  }));

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
