import { Router, Request, Response } from 'express';
import { addToCart, removeFromCart, updateCartItem, getOrCreateCart, createOrder } from '../store/cartStore.js';
import { AddToCartRequest, CheckoutRequest } from '../types/cart.js';
import { cartMiddleware } from '../middlewares/cartMiddleware.js';

const router = Router();

// Apply cart middleware to all routes
router.use(cartMiddleware);

// POST /api/cart - Add item to cart
router.post('/', (req: Request, res: Response) => {
  try {
    const { productId, quantity }: AddToCartRequest = req.body;
    const cartId = req.cartId!;

    // Validation
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
    }

    if (quantity <= 0 || quantity > 10) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be between 1 and 10'
      });
    }

    const cart = addToCart(cartId, productId, quantity);

    res.status(201).json({
      success: true,
      // data: cart,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add item to cart'
    });
  }
});

// GET /api/cart - Get current cart
router.get('/', (req: Request, res: Response) => {
  try {
    const cartId = req.cartId!;
    const cart = getOrCreateCart(cartId);

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

// PATCH /api/cart/:itemId - Update item quantity in cart
router.patch('/:itemId', (req: Request, res: Response) => {
  try {
    const cartId = req.cartId!;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number'
      });
    }

    const cart = updateCartItem(cartId, itemId, quantity);

    res.json({
      success: true,
      data: cart,
      message: quantity === 0 ? 'Item removed from cart successfully' : 'Item quantity updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update item quantity'
    });
  }
});

// DELETE /api/cart/:itemId - Remove item from cart
router.delete('/:itemId', (req: Request, res: Response) => {
  try {
    const cartId = req.cartId!;
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    const cart = removeFromCart(cartId, itemId);

    res.json({
      success: true,
      data: cart,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remove item from cart'
    });
  }
});

export default router;

// POST /api/cart/seed - Seed cart with dummy items
router.post('/seed', (req: Request, res: Response) => {
  try {
    const cartId = req.cartId!;
    // Seed with a few items (ids must exist in db/products.json)
    const itemsToAdd = [
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 2 },
      { productId: 3, quantity: 1 }
    ];

    let cart = getOrCreateCart(cartId);
    for (const item of itemsToAdd) {
      cart = addToCart(cart.id, item.productId, item.quantity);
    }

    res.status(201).json({
      success: true,
      data: cart,
      message: 'Cart seeded with dummy items'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to seed cart'
    });
  }
});
