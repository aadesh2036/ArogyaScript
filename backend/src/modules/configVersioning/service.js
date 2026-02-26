const ConfigVersion = require('./model');
const APIError = require('../../utils/apiError');

const createVersion = async (data) => ConfigVersion.create(data);

const listAll = async () => ConfigVersion.find().sort({ createdAt: -1 });

const getById = async (id) => {
  const config = await ConfigVersion.findById(id);
  if (!config) throw APIError.notFound('Config version not found');
  return config;
};

const getLatestActive = async () =>
  ConfigVersion.findOne({ isActive: true }).sort({ createdAt: -1 });

module.exports = { createVersion, listAll, getById, getLatestActive };
