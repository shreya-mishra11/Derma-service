import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const router = Router();

// In-memory user store
const users = new Map<string, { id: string; name: string; email: string; passwordHash: string }>();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password are required' });
    }

    const emailKey = email.toLowerCase();

    if (users.has(emailKey)) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();

    users.set(emailKey, { id, name, email: emailKey, passwordHash });

    return res.status(201).json({ success: true, data: { id, name, email: emailKey } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to register' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const emailKey = email.toLowerCase();
    const user = users.get(emailKey);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email } } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to login' });
  }
});

export default router;
