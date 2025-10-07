import { Router, Request, Response } from 'express';
import { createOrder, getOrder, getAllOrders, getOrCreateCart, addToCart } from '../store/cartStore.js';
import { cartMiddleware } from '../middlewares/cartMiddleware.js';

const router = Router();

// Apply cart middleware to all routes
router.use(cartMiddleware);

// POST /api/orders - Create order for authenticated user's cart (accepts only paymentMethod)
router.post('/', (req: Request, res: Response) => {
  try {
    const userSub = (req as any).user?.sub as string | undefined;
    if (!userSub) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { paymentMethod } = req.body as { paymentMethod: 'cash' | 'card' | 'upi' };
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }
    if (!['cash', 'card', 'upi'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Payment method must be cash, card, or upi' });
    }

    // Get the user's cart
    const cart = getOrCreateCart(undefined, userSub);
    if (!cart.items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Minimal customer info bound to user
    const customerInfo = {
      name: (req as any).user?.name || `User ${userSub}`,
      email: (req as any).user?.email || `user${userSub}@example.com`,
      phone: '0000000000',
      address: 'Address not provided'
    };

    const order = createOrder(cart.id, customerInfo, paymentMethod, userSub);

    return res.status(201).json({ success: true, data: order, message: 'Order created successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to create order' });
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
