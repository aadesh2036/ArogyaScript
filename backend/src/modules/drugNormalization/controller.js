const drugNormService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const listAll = asyncHandler(async (req, res) => {
  const data = await drugNormService.listAll();
  res.json({ success: true, data });
});

const getSynonym = asyncHandler(async (req, res) => {
  const data = await drugNormService.getSynonymEntry(req.params.genericName);
  res.json({ success: true, data });
});

const addSynonym = asyncHandler(async (req, res) => {
  const data = await drugNormService.addSynonymEntry(req.body);
  res.status(201).json({ success: true, data });
});

const normalize = asyncHandler(async (req, res) => {
  const { name } = req.query;
  const normalized = await drugNormService.normalizeDrug(name);
  res.json({ success: true, normalized });
});

module.exports = { listAll, getSynonym, addSynonym, normalize };
