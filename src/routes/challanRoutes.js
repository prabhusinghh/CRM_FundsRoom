const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const {
  listChallans,
  createChallan,
  getChallan,
  updateChallan,
  confirmChallan,
  cancelChallan,
} = require('../controllers/challanController');

const {
  createChallanValidation,
  updateChallanValidation,
  listChallansValidation,
  challanIdValidation,
} = require('../validators/challanValidator');

router.use(authenticate);

router.get('/', listChallansValidation, validate, listChallans);
router.post('/', requireRole('Admin', 'Sales'), createChallanValidation, validate, createChallan);
router.get('/:id', challanIdValidation, validate, getChallan);
router.put('/:id', requireRole('Admin', 'Sales'), updateChallanValidation, validate, updateChallan);
// Confirming physically ships stock out, so Warehouse can trigger it too, not just Sales/Admin.
router.post(
  '/:id/confirm',
  requireRole('Admin', 'Sales', 'Warehouse'),
  challanIdValidation,
  validate,
  confirmChallan
);
router.post(
  '/:id/cancel',
  requireRole('Admin', 'Sales'),
  challanIdValidation,
  validate,
  cancelChallan
);

module.exports = router;
