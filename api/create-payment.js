// Creates a PayMongo QR Ph payment for one order.
//
// Runs the current (non-deprecated) PayMongo QR Ph flow: Payment Intent -> Payment Method
// (type qrph) -> attach. The Sources API (`POST /v1/sources` type qrph) that older
// integration guides describe is deprecated on PayMongo's side; this uses the flow their
// own docs and Node SDK currently implement.
//
// Body: { amount (centavos, integer), order_number, description }
// Response: { payment_intent_id, client_key, qr_code_url, status }

const PAYMONGO_API = 'https://api.paymongo.com/v1';

function authHeader(key) {
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

async function paymongoRequest(path, key, body) {
  const res = await fetch(`${PAYMONGO_API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(key)
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.errors?.[0]?.detail || 'PayMongo request failed';
    throw new Error(message);
  }
  return data.data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  const publicKey = process.env.PAYMONGO_PUBLIC_KEY;
  if (!secretKey || !publicKey) {
    return res.status(500).json({ error: 'Payment gateway not configured' });
  }

  const { amount, order_number, description } = req.body || {};
  if (!amount || !Number.isInteger(amount) || amount <= 0 || !order_number) {
    return res.status(400).json({ error: 'amount (centavos) and order_number are required' });
  }

  try {
    const intent = await paymongoRequest('/payment_intents', secretKey, {
      data: {
        attributes: {
          amount,
          currency: 'PHP',
          payment_method_allowed: ['qrph'],
          description: description || `Cup of Joy order ${order_number}`,
          metadata: { order_number }
        }
      }
    });

    const paymentMethod = await paymongoRequest('/payment_methods', publicKey, {
      data: {
        attributes: {
          type: 'qrph',
          expiry_seconds: 600 // 10 minutes, matches the on-screen countdown
        }
      }
    });

    const attached = await paymongoRequest(`/payment_intents/${intent.id}/attach`, publicKey, {
      data: {
        attributes: {
          payment_method: paymentMethod.id,
          client_key: intent.attributes.client_key
        }
      }
    });

    const qrCodeUrl = attached.attributes.next_action?.code?.image_url;
    if (!qrCodeUrl) {
      return res.status(502).json({ error: 'PayMongo did not return a QR code image' });
    }

    return res.status(200).json({
      payment_intent_id: intent.id,
      client_key: intent.attributes.client_key,
      qr_code_url: qrCodeUrl,
      status: attached.attributes.status
    });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
};
