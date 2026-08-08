const { body, param, query } = require('express-validator');

const CREATE_STATUSES = ['Draft', 'Confirmed'];
const FILTER_STATUSES = ['Draft', 'Confirmed', 'Cancelled'];

const createChallanValidation = [
  body('customer_id').isInt({ min: 1 }).withMessage('customer_id is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Each item needs a valid product_id'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item quantity must be a positive integer'),
  body('status')
    .optional()
    .isIn(CREATE_STATUSES)
    .withMessage(`status must be one of: ${CREATE_STATUSES.join(', ')}`),
];

const updateChallanValidation = [
  param('id').isInt().withMessage('Invalid challan id'),
  body('customer_id').optional().isInt({ min: 1 }),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('items must be a non-empty array when provided'),
  body('items.*.product_id').optional().isInt({ min: 1 }),
  body('items.*.quantity').optional().isInt({ min: 1 }),
];

const listChallansValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(FILTER_STATUSES),
  query('customerId').optional().isInt({ min: 1 }),
];

const challanIdValidation = [param('id').isInt().withMessage('Invalid challan id')];

module.exports = {
  createChallanValidation,
  updateChallanValidation,
  listChallansValidation,
  challanIdValidation,
};
