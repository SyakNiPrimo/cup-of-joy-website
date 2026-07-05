// Polls a PayMongo Payment Intent's current status.
//
// Body: { payment_intent_id }
// Response: { status, paid: boolean, reference }
//
// Status values (per PayMongo docs): awaiting_payment_method, awaiting_next_action,
// processing (transient, re-poll), succeeded. Falls back to awaiting_payment_method on a
// failed attempt.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: 'Payment gateway not configured' });

  const { payment_intent_id } = req.body || {};
  if (!payment_intent_id) return res.status(400).json({ error: 'payment_intent_id is required' });

  try {
    const auth = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
    const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${payment_intent_id}`, {
      headers: { Authorization: auth }
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.errors?.[0]?.detail || 'Failed to fetch payment status' });
    }

    const attrs = data.data.attributes;
    const lastPayment = attrs.payments?.[attrs.payments.length - 1];

    return res.status(200).json({
      status: attrs.status,
      paid: attrs.status === 'succeeded',
      reference: lastPayment?.id || null
    });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
};
