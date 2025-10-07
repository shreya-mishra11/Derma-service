import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getOrCreateCart } from '../store/cartStore.js';
import { cartMiddleware } from '../middlewares/cartMiddleware.js';

const router = Router();

// Apply cart middleware to all routes
router.use(cartMiddleware);

// Read products data from JSON file
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

// Add addedToCart field to products based on cart
const addCartStatusToProducts = (products: any[], cartId: string) => {
  const cart = getOrCreateCart(cartId);
  const cartProductIds = new Set(cart.items.map(item => item.productId));
  
  return products.map(product => ({
    ...product,
    addedToCart: cartProductIds.has(product.id)
  }));
};

// GET /api/products - Get all products
router.get('/', (req: Request, res: Response) => {
  try {
    const products = getProductsData();
    const cartId = req.cartId!;
    const productsWithCartStatus = addCartStatusToProducts(products, cartId);
    
    res.json({
      success: true,
      data: productsWithCartStatus,
      count: productsWithCartStatus.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const products = getProductsData();
    const productId = parseInt(req.params.id);
    const product = products.find((p: any) => p.id === productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const cartId = req.cartId!;
    const productsWithCartStatus = addCartStatusToProducts([product], cartId);
    
    res.json({
      success: true,
      data: productsWithCartStatus[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', (req: Request, res: Response) => {
  try {
    const products = getProductsData();
    const category = req.params.category;
    const filteredProducts = products.filter((p: any) => 
      p.category.toLowerCase() === category.toLowerCase()
    );
    
    const cartId = req.cartId!;
    const productsWithCartStatus = addCartStatusToProducts(filteredProducts, cartId);
    
    res.json({
      success: true,
      data: productsWithCartStatus,
      count: productsWithCartStatus.length,
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
