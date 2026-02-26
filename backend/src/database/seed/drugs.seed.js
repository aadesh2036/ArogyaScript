const DrugSynonym = require('../../modules/drugNormalization/model');

const drugs = [
    // ── Analgesics / Antipyretics ──────────────────────────────────────────────
    { genericName: 'paracetamol', brandNames: ['crocin', 'dolo', 'tylenol', 'calpol', 'feverex'], synonyms: ['acetaminophen', 'apap'] },
    { genericName: 'ibuprofen', brandNames: ['brufen', 'advil', 'nurofen', 'ibuclin'], synonyms: ['ibuprofene'] },
    { genericName: 'diclofenac', brandNames: ['voveran', 'voltaren', 'dicloran'], synonyms: ['diclofenaco'] },
    { genericName: 'naproxen', brandNames: ['naprosyn', 'naprogesic', 'aleve'], synonyms: [] },
    { genericName: 'aspirin', brandNames: ['ecosprin', 'disprin', 'bayer aspirin'], synonyms: ['acetylsalicylic acid', 'asa'] },
    { genericName: 'tramadol', brandNames: ['ultram', 'tramazac', 'contramal'], synonyms: [] },
    { genericName: 'morphine', brandNames: ['ms contin', 'roxanol', 'morphgesic'], synonyms: ['morphium'] },

    // ── Antibiotics ───────────────────────────────────────────────────────────
    { genericName: 'amoxicillin', brandNames: ['mox', 'novamox', 'amoxil', 'trimox'], synonyms: ['amoxycillin'] },
    { genericName: 'amoxicillin-clavulanate', brandNames: ['augmentin', 'clavam', 'moxclav'], synonyms: ['co-amoxiclav'] },
    { genericName: 'ciprofloxacin', brandNames: ['cifran', 'ciplox', 'cipro', 'cetraxal'], synonyms: [] },
    { genericName: 'azithromycin', brandNames: ['zithromax', 'azithral', 'azicip', 'zady'], synonyms: ['azithromycine'] },
    { genericName: 'doxycycline', brandNames: ['vibramycin', 'doxt-sl', 'doxylab'], synonyms: [] },
    { genericName: 'metronidazole', brandNames: ['flagyl', 'metrogyl', 'metronide'], synonyms: ['metronidazol'] },
    { genericName: 'ceftriaxone', brandNames: ['monocef', 'rocephin', 'oframax'], synonyms: [] },
    { genericName: 'clindamycin', brandNames: ['dalacin', 'clinimycin', 'clincin'], synonyms: [] },

    // ── Cardiovascular ────────────────────────────────────────────────────────
    { genericName: 'amlodipine', brandNames: ['amlovas', 'norvasc', 'stamlo', 'amcard'], synonyms: [] },
    { genericName: 'atorvastatin', brandNames: ['lipitor', 'atorva', 'storvas', 'lipvas'], synonyms: [] },
    { genericName: 'rosuvastatin', brandNames: ['crestor', 'rosuvas', 'rozavel'], synonyms: [] },
    { genericName: 'metoprolol', brandNames: ['lopressor', 'metolar', 'seloken'], synonyms: ['metoprolol tartrate', 'metoprolol succinate'] },
    { genericName: 'atenolol', brandNames: ['tenormin', 'aten', 'betacard'], synonyms: [] },
    { genericName: 'ramipril', brandNames: ['cardace', 'altace', 'ramipace'], synonyms: [] },
    { genericName: 'telmisartan', brandNames: ['telma', 'micardis', 'telsartan'], synonyms: [] },
    { genericName: 'warfarin', brandNames: ['coumadin', 'warf', 'marevan'], synonyms: ['warfarine'] },
    { genericName: 'clopidogrel', brandNames: ['plavix', 'clopilet', 'deplatt'], synonyms: [] },
    { genericName: 'digoxin', brandNames: ['lanoxin', 'digibind', 'digitek'], synonyms: [] },

    // ── Diabetes ──────────────────────────────────────────────────────────────
    { genericName: 'metformin', brandNames: ['glycomet', 'glucophage', 'gluformin', 'obimet'], synonyms: ['metformine'] },
    { genericName: 'glibenclamide', brandNames: ['daonil', 'euglucon', 'semi-daonil'], synonyms: ['glyburide'] },
    { genericName: 'sitagliptin', brandNames: ['januvia', 'glitazone', 'glycomet-gp'], synonyms: [] },
    { genericName: 'insulin glargine', brandNames: ['lantus', 'toujeo', 'basaglar'], synonyms: ['insulin glargine u100'] },

    // ── Respiratory ───────────────────────────────────────────────────────────
    { genericName: 'salbutamol', brandNames: ['ventolin', 'asthalin', 'aerocort'], synonyms: ['albuterol'] },
    { genericName: 'montelukast', brandNames: ['singulair', 'montair', 'seroflo'], synonyms: [] },
    { genericName: 'fluticasone', brandNames: ['flixotide', 'flovent', 'flutide'], synonyms: [] },

    // ── Gastroenterology ─────────────────────────────────────────────────────
    { genericName: 'omeprazole', brandNames: ['omez', 'prilosec', 'losec', 'omizac'], synonyms: ['omeprazol'] },
    { genericName: 'pantoprazole', brandNames: ['pantodac', 'protonix', 'pan 40'], synonyms: [] },
    { genericName: 'ranitidine', brandNames: ['zantac', 'aciloc', 'rantac'], synonyms: [] },
    { genericName: 'ondansetron', brandNames: ['zofran', 'emeset', 'ondanset'], synonyms: ['ondasetron'] },

    // ── Psychiatry / Neurology ────────────────────────────────────────────────
    { genericName: 'escitalopram', brandNames: ['lexapro', 'stalopam', 'nexito'], synonyms: [] },
    { genericName: 'sertraline', brandNames: ['zoloft', 'serta', 'serenata'], synonyms: [] },
    { genericName: 'alprazolam', brandNames: ['xanax', 'alprax', 'alzolam'], synonyms: [] },
    { genericName: 'phenytoin', brandNames: ['dilantin', 'eptoin', 'phenytek'], synonyms: ['diphenylhydantoin'] },
    { genericName: 'pregabalin', brandNames: ['lyrica', 'pregabid', 'prebel'], synonyms: [] },

    // ── Hormones / Thyroid ────────────────────────────────────────────────────
    { genericName: 'levothyroxine', brandNames: ['synthroid', 'eltroxin', 'thyronorm'], synonyms: ['thyroxine', 't4'] },
    { genericName: 'prednisolone', brandNames: ['wysolone', 'omnacortil', 'prelone'], synonyms: [] },
    { genericName: 'dexamethasone', brandNames: ['decadron', 'dexona', 'dexa'], synonyms: [] },

    // ── Vitamins / Supplements ────────────────────────────────────────────────
    { genericName: 'vitamin d3', brandNames: ['uprise-d3', 'calcirol', 'cholecalciferol'], synonyms: ['cholecalciferol', 'colecalciferol'] },
    { genericName: 'vitamin b12', brandNames: ['methylcobalamin', 'mecobalamin', 'cobadex'], synonyms: ['cobalamin', 'cyanocobalamin'] },
    { genericName: 'folic acid', brandNames: ['folicip', 'folsafe', 'folacin'], synonyms: ['vitamin b9', 'folate'] },
    { genericName: 'calcium carbonate', brandNames: ['shelcal', 'calcimax', 'calsium'], synonyms: ['calcium'] },
];

const seed = async (logger) => {
    let created = 0;
    for (const d of drugs) {
        await DrugSynonym.findOneAndUpdate({ genericName: d.genericName }, d, { upsert: true });
        created++;
    }
    logger.info(`  ✔ Drug Synonyms: ${created} records seeded`);
};

module.exports = seed;
