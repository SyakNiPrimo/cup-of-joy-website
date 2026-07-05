// PayMongo webhook receiver. Verifies the Paymongo-Signature header and updates the
// matching online_orders row when a QR Ph payment succeeds or fails.
//
// Signature scheme (confirmed by reading PayMongo's own Node SDK source,
// `paymongo-node/src/services/Webhook.js`, since their docs don't spell out the exact
// format): header is `t=<unix_ts>,te=<test_sig>,li=<live_sig>`. The signed string is
// `${timestamp}.${rawBody}`, HMAC-SHA256 with the webhook's signing secret, hex digest,
// compared against `li` (we're live-mode only). This requires the untouched raw body —
// this file deliberately never touches req.body, which would trigger Vercel's automatic
// JSON parser and make the raw bytes unrecoverable.

const crypto = require('crypto');

const INSFORGE_BASE_URL = 'https://pvpiya9j.us-east.insforge.app';
const INSFORGE_ANON_KEY = 'anon_e730824779c5d7b0e80185ec5b848574506f206fe52184ad17ff69d633586a1b';

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function verifySignature(signatureHeader, rawBody, webhookSecret) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map(p => {
      const [k, v] = p.split('=');
      return [k, v];
    })
  );
  const { t: timestamp, li: liveSignature } = parts;
  if (!timestamp || !liveSignature) return false;

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(liveSignature, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

async function updateOrder(paymentIntentId, fields) {
  const res = await fetch(
    `${INSFORGE_BASE_URL}/api/database/records/online_orders?payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${INSFORGE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fields)
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`InsForge update failed: ${res.status} ${text}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('PAYMONGO_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const rawBody = await readRawBody(req);
  const signatureHeader = req.headers['paymongo-signature'];

  if (!verifySignature(signatureHeader, rawBody, webhookSecret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const eventType = event?.data?.attributes?.type;
  const resource = event?.data?.attributes?.data;

  try {
    if (eventType === 'payment.paid') {
      const paymentIntentId = resource?.attributes?.payment_intent_id;
      if (paymentIntentId) {
        const paidAtSeconds = resource.attributes.paid_at;
        await updateOrder(paymentIntentId, {
          payment_status: 'paid',
          paid_at: paidAtSeconds ? new Date(paidAtSeconds * 1000).toISOString() : new Date().toISOString(),
          paymongo_reference: resource.id
        });
      }
    } else if (eventType === 'payment.failed') {
      const paymentIntentId = resource?.attributes?.payment_intent_id;
      if (paymentIntentId) {
        await updateOrder(paymentIntentId, { payment_status: 'failed' });
      }
    }
    // Other event types are acknowledged but ignored.
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Still 200 so PayMongo doesn't retry-storm us for a downstream DB hiccup;
    // the frontend poll is the primary confirmation path and will catch up.
    return res.status(200).json({ received: true, warning: err.message });
  }
};
