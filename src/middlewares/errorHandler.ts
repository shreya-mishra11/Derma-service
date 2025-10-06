import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({
    message: err.message ?? 'Internal Server Error',
    // only return stack in non-production
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};