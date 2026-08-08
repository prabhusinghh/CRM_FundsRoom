const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const customerModel = require('../models/customerModel');

// GET /api/customers?search=&status=&type=&page=&limit=
const listCustomers = asyncHandler(async (req, res) => {
  const { search, status, type } = req.query;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const { rows, total } = await customerModel.findAll({
    search,
    status,
    customerType: type,
    page,
    limit,
  });

  res.json({ success: true, data: rows, page, limit, total });
});
// POST /api/customers
const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerModel.create(req.body, req.user.id);
  res.status(201).json({ success: true, data: customer });
});

// GET /api/customers/:id  (includes follow-up history)
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerModel.findById(req.params.id);
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }
  const followups = await customerModel.getFollowups(req.params.id);
  res.json({ success: true, data: { ...customer, followups } });
});

// PUT /api/customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const existing = await customerModel.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Customer not found');
  }
  const updated = await customerModel.update(req.params.id, req.body);
  res.json({ success: true, data: updated });
});

// POST /api/customers/:id/followups
const addFollowup = asyncHandler(async (req, res) => {
  const existing = await customerModel.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Customer not found');
  }
  const followup = await customerModel.addFollowup(req.params.id, req.body, req.user.id);
  res.status(201).json({ success: true, data: followup });
});

module.exports = { listCustomers, createCustomer, getCustomer, updateCustomer, addFollowup };
