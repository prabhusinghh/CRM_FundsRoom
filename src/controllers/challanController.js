const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const challanModel = require('../models/challanModel');

// GET /api/challans?status=&customerId=&page=&limit=
const listChallans = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const { rows, total } = await challanModel.findAll({ status, customerId, page, limit });
  res.json({ success: true, data: rows, page, limit, total });
});

// POST /api/challans  (status: 'Draft' default, or 'Confirmed' to deduct stock immediately)
const createChallan = asyncHandler(async (req, res) => {
  const { customer_id, items, status } = req.body;
  const challan = await challanModel.create({ customer_id, items, status }, req.user.id);
  res.status(201).json({ success: true, data: challan });
});

// GET /api/challans/:id
const getChallan = asyncHandler(async (req, res) => {
  const challan = await challanModel.findById(req.params.id);
  if (!challan) {
    throw new ApiError(404, 'Challan not found');
  }
  res.json({ success: true, data: challan });
});

// PUT /api/challans/:id  (Draft only)
const updateChallan = asyncHandler(async (req, res) => {
  const { customer_id, items } = req.body;
  const challan = await challanModel.updateDraft(req.params.id, { customer_id, items });
  res.json({ success: true, data: challan });
});

// POST /api/challans/:id/confirm
const confirmChallan = asyncHandler(async (req, res) => {
  const challan = await challanModel.confirm(req.params.id, req.user.id);
  res.json({ success: true, data: challan });
});

// POST /api/challans/:id/cancel
const cancelChallan = asyncHandler(async (req, res) => {
  const challan = await challanModel.cancel(req.params.id, req.user.id);
  res.json({ success: true, data: challan });
});

module.exports = {
  listChallans,
  createChallan,
  getChallan,
  updateChallan,
  confirmChallan,
  cancelChallan,
};
