const configVersionService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const listAll = asyncHandler(async (req, res) => {
  const data = await configVersionService.listAll();
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const data = await configVersionService.createVersion(req.body);
  res.status(201).json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await configVersionService.getById(req.params.id);
  res.json({ success: true, data });
});

module.exports = { listAll, create, getOne };
