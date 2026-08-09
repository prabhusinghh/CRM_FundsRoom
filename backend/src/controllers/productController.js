const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const productModel = require('../models/productModel');
const stockMovementModel = require('../models/stockMovementModel');

// GET /api/products?search=&category=&lowStock=&page=&limit=
const listProducts = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const lowStock = req.query.lowStock === 'true';
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const { rows, total } = await productModel.findAll({ search, category, lowStock, page, limit });

  res.json({ success: true, data: rows, page, limit, total });
});

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const existing = await productModel.findBySku(req.body.sku);
  if (existing) {
    throw new ApiError(409, `SKU '${req.body.sku}' already exists`);
  }
  const product = await productModel.create(req.body);
  res.status(201).json({ success: true, data: product });
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await productModel.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  res.json({ success: true, data: product });
});

// PUT /api/products/:id  (current_stock is never touched here)
const updateProduct = asyncHandler(async (req, res) => {
  const existing = await productModel.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Product not found');
  }

  if (req.body.sku && req.body.sku !== existing.sku) {
    const duplicate = await productModel.findBySku(req.body.sku);
    if (duplicate) {
      throw new ApiError(409, `SKU '${req.body.sku}' already exists`);
    }
  }

  const updated = await productModel.update(req.params.id, req.body);
  res.json({ success: true, data: updated });
});

// GET /api/products/:id/stock-log
const getStockLog = asyncHandler(async (req, res) => {
  const product = await productModel.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const { rows, total } = await stockMovementModel.findByProduct(req.params.id, { page, limit });
  res.json({ success: true, data: rows, page, limit, total });
});

// POST /api/products/:id/stock-movement  (manual IN/OUT adjustment)
const addStockMovement = asyncHandler(async (req, res) => {
  const { quantity_changed, movement_type, reason } = req.body;

  const { movement, newStock } = await stockMovementModel.recordMovement(
    req.params.id,
    { quantity_changed, movement_type, reason, reference_type: 'MANUAL' },
    req.user.id
  );

  res.status(201).json({ success: true, data: { movement, current_stock: newStock } });
});

module.exports = {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  getStockLog,
  addStockMovement,
};
