import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import healthRouter from './routes/health';
import productsRouter from './routes/products';
import { notFound, errorHandler } from './middlewares/errorHandler';

const app = express();

// middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// routes
app.use('/api', healthRouter);
app.use('/api/products', productsRouter);

// 404 + error handler (should be after routes)
app.use(notFound);
app.use(errorHandler);

export default app;