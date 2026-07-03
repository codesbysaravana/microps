import { Request, Response } from 'express';
import { stripe } from '../config/stripe';
import { stripeService } from '../services/stripe.service';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else if (process.env.NODE_ENV !== 'production') {
      // Dev/Testing fallback when simulating events without live CLI webhook signing
      event = typeof req.body === 'string' || Buffer.isBuffer(req.body) 
        ? JSON.parse(req.body.toString('utf8')) 
        : req.body;
    } else {
      console.error('❌ [Stripe Webhook Error] Missing STRIPE_WEBHOOK_SECRET or Stripe-Signature header in production.');
      return res.status(400).send('Webhook Error: Missing signature.');
    }
  } catch (err: any) {
    console.error(`❌ [Stripe Webhook Error] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await stripeService.handleWebhookEvent(event);
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`❌ [Stripe Webhook Error] Processing handler failed:`, err);
    return res.status(500).send('Internal Webhook Processing Error');
  }
};
