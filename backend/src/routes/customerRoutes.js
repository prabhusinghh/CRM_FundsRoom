const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const {
  listCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  addFollowup,
} = require('../controllers/customerController');

const {
  createCustomerValidation,
  updateCustomerValidation,
  listCustomersValidation,
  customerIdValidation,
  addFollowupValidation,
} = require('../validators/customerValidator');

// Every customer route requires a logged-in user; only Admin/Sales can write.
router.use(authenticate);

router.get('/', listCustomersValidation, validate, listCustomers);
router.post('/', requireRole('Admin', 'Sales'), createCustomerValidation, validate, createCustomer);
router.get('/:id', customerIdValidation, validate, getCustomer);
router.put(
  '/:id',
  requireRole('Admin', 'Sales'),
  updateCustomerValidation,
  validate,
  updateCustomer
);
router.post(
  '/:id/followups',
  requireRole('Admin', 'Sales'),
  addFollowupValidation,
  validate,
  addFollowup
);

module.exports = router;
