import { Router, Request, Response } from 'express';
import { createOrder, getOrder, getAllOrders, getOrCreateCart, addToCart } from '../store/cartStore.js';
import { cartMiddleware } from '../middlewares/cartMiddleware.js';

const router = Router();

// Apply cart middleware to all routes
router.use(cartMiddleware);

// POST /api/orders - Create order from cart ID, single product, or multiple products
router.post('/', (req: Request, res: Response) => {
  try {
    const { cartId, productId, quantity, items, paymentMethod, userId } = req.body;

    // Validation
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    if (!['cash', 'card', 'upi'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Payment method must be cash, card, or upi'
      });
    }

    let orderCartId = cartId;

    // If items array is provided (multiple products), build a temporary cart
    if (Array.isArray(items) && items.length > 0 && !cartId) {
      const tempCart = getOrCreateCart();
      let cart = tempCart;
      for (const entry of items) {
        if (!entry?.productId || !entry?.quantity || entry.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each item must include productId and positive quantity'
          });
        }
        cart = addToCart(cart.id, Number(entry.productId), Number(entry.quantity));
      }
      orderCartId = cart.id;
    // Else if productId+quantity provided, create a temporary cart with single product
    } else if (productId && !cartId) {
      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity is required when creating order from product ID'
        });
      }
      const tempCart = getOrCreateCart();
      const cart = addToCart(tempCart.id, Number(productId), Number(quantity));
      orderCartId = cart.id;
    } else if (!cartId) {
      // Use current user's cart if no cartId provided
      orderCartId = req.cartId!;
    }

    // Create order with minimal customer info (can be enhanced with user auth)
    const customerInfo = {
      name: userId ? `User ${userId}` : 'Guest User',
      email: userId ? `user${userId}@example.com` : 'guest@example.com',
      phone: '0000000000',
      address: 'Address not provided'
    };

    const order = createOrder(orderCartId, customerInfo, paymentMethod);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create order'
    });
  }
});

// GET /api/orders - Get all orders (for admin or user history)
router.get('/', (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    let orders = getAllOrders();

    // Filter by user if userId provided
    if (userId) {
      orders = orders.filter(order => 
        order.customerInfo.name.includes(`User ${userId}`) ||
        order.customerInfo.email.includes(`user${userId}@`)
      );
    }

    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// GET /api/orders/:orderId - Get specific order by ID
router.get('/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

export default router;
