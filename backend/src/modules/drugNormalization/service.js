const DrugSynonym = require('./model');
const APIError = require('../../utils/apiError');

const normalizeDrug = async (rawName) => {
  const synonym = await DrugSynonym.findOne({
    $or: [
      { genericName: { $regex: new RegExp(rawName, 'i') } },
      { brandNames: { $regex: new RegExp(rawName, 'i') } },
      { synonyms: { $regex: new RegExp(rawName, 'i') } },
    ],
  });
  return synonym ? synonym.genericName : rawName.toLowerCase();
};

const getSynonymEntry = async (genericName) => {
  const entry = await DrugSynonym.findOne({ genericName: genericName.toLowerCase() });
  if (!entry) throw APIError.notFound(`No synonym entry for: ${genericName}`);
  return entry;
};

const addSynonymEntry = async (data) => {
  return DrugSynonym.findOneAndUpdate(
    { genericName: data.genericName.toLowerCase() },
    data,
    { upsert: true, new: true }
  );
};

const listAll = async () => DrugSynonym.find().sort({ genericName: 1 });

module.exports = { normalizeDrug, getSynonymEntry, addSynonymEntry, listAll };
