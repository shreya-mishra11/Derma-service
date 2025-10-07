import { Request, Response, NextFunction } from 'express';
import { getOrCreateCart } from '../store/cartStore.js';

// Middleware to handle cart ID from header or create new one
export const cartMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Priority: signed cookie -> header -> new cart
  const cookieCartId = (req.signedCookies && req.signedCookies.cartId) as string | undefined;
  const headerCartId = req.headers['x-cart-id'] as string | undefined;

  const incomingId = cookieCartId || headerCartId;

  if (incomingId) {
    try {
      const cart = getOrCreateCart(incomingId);
      req.cartId = cart.id;
      // ensure cookie set
      res.cookie('cartId', cart.id, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        signed: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    } catch (error) {
      const newCart = getOrCreateCart();
      req.cartId = newCart.id;
      res.cookie('cartId', newCart.id, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        signed: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }
  } else {
    const newCart = getOrCreateCart();
    req.cartId = newCart.id;
    res.cookie('cartId', newCart.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }

  next();
};

// Extend Request interface to include cartId
declare global {
  namespace Express {
    interface Request {
      cartId?: string;
    }
  }
}
