const { body, param, query } = require('express-validator');

const stockMovementValidation = [
  param('id').isInt().withMessage('Invalid product id'),
  body('quantity_changed')
    .isInt({ min: 1 })
    .withMessage('quantity_changed must be a positive integer'),
  body('movement_type').isIn(['IN', 'OUT']).withMessage("movement_type must be 'IN' or 'OUT'"),
  body('reason').trim().notEmpty().withMessage('Reason is required').isLength({ max: 255 }),
];

const stockLogValidation = [
  param('id').isInt().withMessage('Invalid product id'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { stockMovementValidation, stockLogValidation };
