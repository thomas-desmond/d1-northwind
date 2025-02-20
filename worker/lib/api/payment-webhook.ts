import type { DiscriminatedWebhookPayload } from "../../payment.types";

const verifySignature = async (secret: string, signature: string, body: string) => {
    const encoder = new TextEncoder();
  
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  
    const hmac = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );
  
    const expectedSignature = Array.from(new Uint8Array(hmac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedSignature;
};

const SUPPORTED_EVENTS = [
    'subscription_created',
    'subscription_updated', 
    'subscription_cancelled',
    'subscription_expired'
];

const apiPaymentWebhook = () => {
  return {
    path: "webhook",
    method: "POST",
    handler: async (request: Request, env: Env) => {
      const secret = env.SECRET;
      const signature = request.headers.get("x-signature");

      if (!signature || !secret) {
        return { error: 401, msg: "Unauthorized" };
      }

      const body = await request.text();
      const isValid = await verifySignature(secret, signature, body);

      if (!isValid) {
        return { error: 401, msg: "Unauthorized" };
      }

      const payload = JSON.parse(body) as DiscriminatedWebhookPayload<{email: string}>;
      const { event_name: eventName } = payload.meta;

      if (!SUPPORTED_EVENTS.includes(eventName)) {
        return { error: 400, msg: "Event not supported" };
      }

      if (!payload.data.attributes.user_email) {
        return { error: 400, msg: "Email not found" };
      }

      // Mock DB update
      const isSubscriptionActive = ['subscription_created', 'subscription_updated'].includes(eventName);
      console.log('Would update subscription:', {
        email: payload.data.attributes.user_email,
        subscriptionId: isSubscriptionActive ? payload.data.id : null
      });

      console.log('Webhook processed successfully');
      return { message: "Webhook received" };
    }
  };
};

export { apiPaymentWebhook };

