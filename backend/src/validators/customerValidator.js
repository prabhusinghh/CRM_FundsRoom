const { body, param, query } = require('express-validator');

const CUSTOMER_TYPES = ['Retail', 'Wholesale', 'Distributor'];
const CUSTOMER_STATUSES = ['Lead', 'Active', 'Inactive'];
const MOBILE_REGEX = /^[0-9+\-\s()]{7,20}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

const createCustomerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(MOBILE_REGEX)
    .withMessage('Enter a valid mobile number'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email'),
  body('business_name').optional({ checkFalsy: true }).isLength({ max: 150 }),
  body('gst_number')
    .optional({ checkFalsy: true })
    .matches(GST_REGEX)
    .withMessage('Enter a valid 15-character GSTIN'),
  body('customer_type')
    .optional()
    .isIn(CUSTOMER_TYPES)
    .withMessage(`customer_type must be one of: ${CUSTOMER_TYPES.join(', ')}`),
  body('status')
    .optional()
    .isIn(CUSTOMER_STATUSES)
    .withMessage(`status must be one of: ${CUSTOMER_STATUSES.join(', ')}`),
  body('follow_up_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('follow_up_date must be a valid date (YYYY-MM-DD)'),
  body('address').optional({ checkFalsy: true }).isString(),
  body('notes').optional({ checkFalsy: true }).isString(),
];

const updateCustomerValidation = [
  param('id').isInt().withMessage('Invalid customer id'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('mobile')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Mobile cannot be empty')
    .matches(MOBILE_REGEX)
    .withMessage('Enter a valid mobile number'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email'),
  body('gst_number')
    .optional({ checkFalsy: true })
    .matches(GST_REGEX)
    .withMessage('Enter a valid 15-character GSTIN'),
  body('customer_type').optional().isIn(CUSTOMER_TYPES),
  body('status').optional().isIn(CUSTOMER_STATUSES),
  body('follow_up_date').optional({ checkFalsy: true }).isISO8601(),
];

const listCustomersValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('status').optional().isIn(CUSTOMER_STATUSES),
  query('type').optional().isIn(CUSTOMER_TYPES),
];

const customerIdValidation = [param('id').isInt().withMessage('Invalid customer id')];

const addFollowupValidation = [
  param('id').isInt().withMessage('Invalid customer id'),
  body('note').trim().notEmpty().withMessage('Note is required'),
  body('follow_up_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('follow_up_date must be a valid date (YYYY-MM-DD)'),
];

module.exports = {
  createCustomerValidation,
  updateCustomerValidation,
  listCustomersValidation,
  customerIdValidation,
  addFollowupValidation,
};
