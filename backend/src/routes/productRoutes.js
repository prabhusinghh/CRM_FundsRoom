const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  getStockLog,
  addStockMovement,
} = require('../controllers/productController');

const {
  createProductValidation,
  updateProductValidation,
  listProductsValidation,
  productIdValidation,
} = require('../validators/productValidator');

const { stockMovementValidation, stockLogValidation } = require('../validators/stockValidator');

// Every product route requires a logged-in user; only Admin/Warehouse can write.
router.use(authenticate);

router.get('/', listProductsValidation, validate, listProducts);
router.post('/', requireRole('Admin', 'Warehouse'), createProductValidation, validate, createProduct);
router.get('/:id', productIdValidation, validate, getProduct);
router.put('/:id', requireRole('Admin', 'Warehouse'), updateProductValidation, validate, updateProduct);
router.get('/:id/stock-log', stockLogValidation, validate, getStockLog);
router.post(
  '/:id/stock-movement',
  requireRole('Admin', 'Warehouse'),
  stockMovementValidation,
  validate,
  addStockMovement
);

module.exports = router;
