import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Middleware
import { corsMiddleware } from './middleware/cors.js';
import { validateApiKey } from './middleware/auth.js';
import { limiter } from './middleware/rateLimit.js';

// Routes
import chatRoutes from './routes/chat.js';
import healthRoutes from './routes/health.js';

// Config
import { PORT } from './config/constants.js';

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(corsMiddleware);

// Routes
app.use('/api', limiter, validateApiKey, chatRoutes);
app.use('/health', healthRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
