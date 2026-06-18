import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler, notFound } from './middleware/error';
import authRoutes from './routes/auth.routes';
import familyRoutes from './routes/family.routes';
import requestRoutes from './routes/request.routes';
import userRoutes from './routes/user.routes';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
    }),
  );
  app.use(express.json());
  if (!config.isProduction) {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'family-requests-backend' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/family', familyRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/users', userRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
