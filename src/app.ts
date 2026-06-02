import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';

import { ENV } from '#configs/environment';
import { apiLimiter } from '#middlewares/rateLimiter';
import { errorHandler } from '#middlewares/errorHandler';
import { ApiError } from '#utils/ApiError';
import { ERROR_CODES } from '#constants/errorCode';
import v1Routes from '#routes/v1';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '#configs/swagger';

const app = express();

// === Global Middlewares ===
app.use(helmet());

app.use(cors({
  origin: ENV.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  mongoSanitize.sanitize(req.headers);
  next();
});

if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', apiLimiter);

// === Routes ===
app.use('/api/v1', v1Routes);

// === Health check ===
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// === Swagger UI ===
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Japanese EdTech API Docs',
}));

// === 404 Handler ===
app.use((req, res, next) => {
  next(new ApiError(ERROR_CODES.NOT_FOUND, `Route ${req.originalUrl} không tồn tại`));
});

// === Global Error Handler ===
app.use(errorHandler);

export default app;
