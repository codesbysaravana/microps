import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import v1Routes from './routes/v1';
import webhookRoutes from './routes/v1/webhook.routes';

const app: Express = express();

// Trust Cloudflare and AWS ALB proxy headers (X-Forwarded-Proto, CF-Connecting-IP)
app.set('trust proxy', 1);

// Security and utility middlewares
app.use(helmet());
app.use(cors());

// Mount Stripe webhook route BEFORE express.json() so raw body buffer is preserved for HMAC verification
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/v1', v1Routes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
