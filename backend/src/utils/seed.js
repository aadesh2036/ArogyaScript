require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');

// Models
const ConfigVersion = require('./modules/configVersioning/model');
const DrugSynonym = require('./modules/drugNormalization/model');
const { InteractionKB } = require('./modules/interaction/model');

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  logger.info('Connected to MongoDB for seeding...');

  // ── Config Version ───────────────────────────────────────────────────────────
  await ConfigVersion.findOneAndUpdate(
    { versionName: 'v1.0-default' },
    {
      versionName: 'v1.0-default',
      interactionWeight: 0.35,
      ocrConfidenceThreshold: 0.75,
      dosageAnomalyThreshold: 0.6,
      isActive: true,
      notes: 'Default production configuration',
    },
    { upsert: true }
  );
  logger.info('Seeded: ConfigVersion');

  // ── Drug Synonyms ────────────────────────────────────────────────────────────
  const synonyms = [
    { genericName: 'paracetamol', brandNames: ['crocin', 'dolo', 'tylenol', 'calpol'], synonyms: ['acetaminophen'] },
    { genericName: 'ibuprofen', brandNames: ['brufen', 'advil', 'nurofen'], synonyms: ['ibuprofene'] },
    { genericName: 'amoxicillin', brandNames: ['mox', 'novamox', 'amoxil'], synonyms: ['amoxycillin'] },
    { genericName: 'metformin', brandNames: ['glycomet', 'glucophage', 'gluformin'], synonyms: [] },
    { genericName: 'amlodipine', brandNames: ['amlovas', 'norvasc', 'stamlo'], synonyms: [] },
    { genericName: 'atorvastatin', brandNames: ['lipitor', 'atorva', 'storvas'], synonyms: [] },
    { genericName: 'omeprazole', brandNames: ['omez', 'prilosec', 'losec'], synonyms: ['omeprazol'] },
    { genericName: 'warfarin', brandNames: ['coumadin', 'warf'], synonyms: [] },
    { genericName: 'aspirin', brandNames: ['ecosprin', 'disprin'], synonyms: ['acetylsalicylic acid'] },
    { genericName: 'ciprofloxacin', brandNames: ['cifran', 'ciplox', 'cipro'], synonyms: [] },
  ];

  for (const s of synonyms) {
    await DrugSynonym.findOneAndUpdate({ genericName: s.genericName }, s, { upsert: true });
  }
  logger.info(`Seeded: ${synonyms.length} drug synonyms`);

  // ── Interaction Knowledge Base ────────────────────────────────────────────────
  const interactions = [
    { drugA: 'warfarin', drugB: 'aspirin', severity: 'high', mechanism: 'Additive anticoagulant effect', recommendation: 'Avoid combination; monitor INR closely if unavoidable.' },
    { drugA: 'warfarin', drugB: 'ibuprofen', severity: 'high', mechanism: 'NSAIDs increase bleeding risk with warfarin', recommendation: 'Use paracetamol instead; if NSAID needed, monitor INR.' },
    { drugA: 'metformin', drugB: 'ibuprofen', severity: 'moderate', mechanism: 'NSAIDs may impair renal function, increasing metformin accumulation', recommendation: 'Monitor renal function; consider short-term use only.' },
    { drugA: 'amlodipine', drugB: 'atorvastatin', severity: 'low', mechanism: 'Amlodipine inhibits CYP3A4, modestly increasing atorvastatin levels', recommendation: 'Limit atorvastatin dose to 20mg/day when combined.' },
    { drugA: 'ciprofloxacin', drugB: 'warfarin', severity: 'high', mechanism: 'Ciprofloxacin inhibits warfarin metabolism (CYP1A2)', recommendation: 'Monitor INR closely; consider antibiotic alternative.' },
    { drugA: 'omeprazole', drugB: 'metformin', severity: 'low', mechanism: 'Minimal clinically significant interaction', recommendation: 'No specific action required.' },
    { drugA: 'aspirin', drugB: 'ibuprofen', severity: 'moderate', mechanism: 'Ibuprofen may reduce antiplatelet effect of aspirin', recommendation: 'Take aspirin at least 2 hours before ibuprofen.' },
    { drugA: 'amoxicillin', drugB: 'warfarin', severity: 'moderate', mechanism: 'Amoxicillin may alter gut flora reducing vitamin K production', recommendation: 'Monitor INR during antibiotic course.' },
  ];

  for (const i of interactions) {
    await InteractionKB.findOneAndUpdate({ drugA: i.drugA, drugB: i.drugB }, i, { upsert: true });
  }
  logger.info(`Seeded: ${interactions.length} interaction KB entries`);

  await mongoose.disconnect();
  logger.info('✅ Seeding complete.');
};

seedData().catch((err) => {
  logger.error('Seed failed:', err.message);
  process.exit(1);
});
