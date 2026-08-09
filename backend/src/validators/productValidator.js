const { body, param, query } = require('express-validator');

const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('sku').trim().notEmpty().withMessage('SKU is required').isLength({ max: 50 }),
  body('category').optional({ checkFalsy: true }).isLength({ max: 100 }),
  body('unit_price')
    .notEmpty()
    .withMessage('Unit price is required')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  body('current_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a non-negative integer'),
  body('min_stock_alert')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock alert must be a non-negative integer'),
  body('warehouse_location').optional({ checkFalsy: true }).isLength({ max: 100 }),
];

const updateProductValidation = [
  param('id').isInt().withMessage('Invalid product id'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty').isLength({ max: 50 }),
  body('unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('min_stock_alert').optional().isInt({ min: 0 }),
  body('category').optional({ checkFalsy: true }).isLength({ max: 100 }),
  body('warehouse_location').optional({ checkFalsy: true }).isLength({ max: 100 }),
  // Note: current_stock is not accepted here on purpose — see productModel.js
  body('current_stock')
    .not()
    .exists()
    .withMessage('current_stock cannot be edited directly; use POST /:id/stock-movement'),
];

const listProductsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('lowStock').optional().isBoolean().withMessage('lowStock must be true or false'),
];

const productIdValidation = [param('id').isInt().withMessage('Invalid product id')];

module.exports = {
  createProductValidation,
  updateProductValidation,
  listProductsValidation,
  productIdValidation,
};
