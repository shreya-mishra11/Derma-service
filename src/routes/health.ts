import { Router, Request, Response } from 'express';
const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    env: process.env.NODE_ENV ?? 'development',
    time: new Date().toISOString()
  });
});

export default router;