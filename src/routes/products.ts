import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

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

// GET /api/products - Get all products
router.get('/', (req: Request, res: Response) => {
  try {
    const products = getProductsData();
    res.json({
      success: true,
      data: products,
      count: products.length
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
    
    res.json({
      success: true,
      data: product
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
    
    res.json({
      success: true,
      data: filteredProducts,
      count: filteredProducts.length,
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
