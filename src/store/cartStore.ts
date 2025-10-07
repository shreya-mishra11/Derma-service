import { Cart, CartItem, Order } from '../types/cart.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// In-memory stores
const carts = new Map<string, Cart>();
const userIdToCartId = new Map<string, string>();
const orders = new Map<string, Order>();

// Get products data
const getProductsData = () => {
  try {
    const filePath = join(process.cwd(), 'db', 'products.json');
    const data = readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products data:', error);
    return [];
  }
};

// Generate cart ID
export const generateCartId = (): string => {
  return randomUUID();
};

// Get or create cart
export const getOrCreateCart = (cartId?: string, userId?: string): Cart => {
  if (userId) {
    const existingCartId = userIdToCartId.get(userId);
    if (existingCartId && carts.has(existingCartId)) {
      return carts.get(existingCartId)!;
    }
  }

  if (cartId && carts.has(cartId)) {
    return carts.get(cartId)!;
  }

  const newCartId = generateCartId();
  const newCart: Cart = {
    id: newCartId,
    userId,
    items: [],
    totalItems: 0,
    totalAmount: 0,
    currency: 'INR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  carts.set(newCartId, newCart);
  if (userId) userIdToCartId.set(userId, newCartId);
  return newCart;
};

// Add item to cart
export const addToCart = (cartId: string, productId: number, quantity: number, userId?: string): Cart => {
  const cart = getOrCreateCart(cartId, userId);
  const products = getProductsData();
  const product = products.find((p: any) => p.id === productId);

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.stock < quantity) {
    throw new Error('Insufficient stock');
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

  if (existingItemIndex >= 0) {
    // Update existing item quantity
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    const newItem: CartItem = {
      id: randomUUID(),
      productId: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      quantity,
      image: product.image,
      brand: product.brand
    };
    cart.items.push(newItem);
  }

  // Update cart totals
  updateCartTotals(cart);
  cart.updatedAt = new Date().toISOString();

  return cart;
};

// Remove item from cart
export const removeFromCart = (cartId: string, itemId: string): Cart => {
  const cart = getOrCreateCart(cartId);
  const itemIndex = cart.items.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  cart.items.splice(itemIndex, 1);
  updateCartTotals(cart);
  cart.updatedAt = new Date().toISOString();

  return cart;
};

// Update item quantity in cart
export const updateCartItem = (cartId: string, itemId: string, quantity: number): Cart => {
  const cart = getOrCreateCart(cartId);
  const itemIndex = cart.items.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    // If quantity is 0 or negative, remove the item
    cart.items.splice(itemIndex, 1);
  } else if (quantity > 10) {
    throw new Error('Quantity cannot exceed 10');
  } else {
    // Check stock availability
    const products = getProductsData();
    const product = products.find((p: any) => p.id === cart.items[itemIndex].productId);
    
    if (product && product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    cart.items[itemIndex].quantity = quantity;
  }

  updateCartTotals(cart);
  cart.updatedAt = new Date().toISOString();

  return cart;
};

// Update cart totals
const updateCartTotals = (cart: Cart): void => {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// Create order
export const createOrder = (cartId: string, customerInfo: any, paymentMethod: string, userId?: string): Order => {
  const cart = getOrCreateCart(cartId, userId);

  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  const order: Order = {
    id: randomUUID(),
    cartId,
    userId: userId ?? cart.userId,
    customerInfo,
    items: [...cart.items],
    totalAmount: cart.totalAmount,
    currency: cart.currency,
    paymentMethod,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  orders.set(order.id, order);

  // Clear cart after order
  cart.items = [];
  updateCartTotals(cart);
  cart.updatedAt = new Date().toISOString();

  return order;
};

// Get order by ID
export const getOrder = (orderId: string): Order | undefined => {
  return orders.get(orderId);
};

// Get all orders
export const getAllOrders = (): Order[] => {
  return Array.from(orders.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};
