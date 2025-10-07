import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import healthRouter from './routes/health';
import cookieParser from 'cookie-parser';
import productsRouter from './routes/products';
import cartRouter from './routes/cart';
import ordersRouter from './routes/orders';
import { notFound, errorHandler } from './middlewares/errorHandler';

const app = express();

// middlewares
app.use(morgan('dev'));
app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // reflect request origin
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'dev-secret'));

// routes
app.use('/api', healthRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);

// 404 + error handler (should be after routes)
app.use(notFound);
app.use(errorHandler);

export default app;