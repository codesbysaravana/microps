import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ [Stripe Config] STRIPE_SECRET_KEY is not defined in environment variables.');
}

export const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
});
