const { InteractionKB } = require('../../modules/interaction/model');

/**
 * Clinically verified drug-drug interactions.
 * Sources: WHO, BNF, UpToDate references.
 * All drug names in lowercase to match normalized KB.
 */
const interactions = [
    // ── HIGH SEVERITY ──────────────────────────────────────────────────────────
    {
        drugA: 'warfarin', drugB: 'aspirin', severity: 'high',
        mechanism: 'Additive anticoagulant and antiplatelet effects increase bleeding risk significantly.',
        recommendation: 'Avoid combination. If unavoidable, monitor INR closely and watch for signs of bleeding.',
    },
    {
        drugA: 'warfarin', drugB: 'ibuprofen', severity: 'high',
        mechanism: 'NSAIDs inhibit platelet aggregation and may damage GI mucosa; combined with warfarin this greatly elevates bleeding risk.',
        recommendation: 'Use paracetamol for analgesia instead. If NSAID is necessary, reduce warfarin dose and monitor INR every 2–3 days.',
    },
    {
        drugA: 'warfarin', drugB: 'ciprofloxacin', severity: 'high',
        mechanism: 'Ciprofloxacin inhibits CYP1A2, reducing warfarin clearance and raising INR unpredictably.',
        recommendation: 'Monitor INR within 2 days of starting/stopping ciprofloxacin. Consider alternative antibiotic.',
    },
    {
        drugA: 'warfarin', drugB: 'metronidazole', severity: 'high',
        mechanism: 'Metronidazole inhibits CYP2C9, the primary enzyme metabolising warfarin, causing substantial INR elevation.',
        recommendation: 'Reduce warfarin dose by ~25–50% during metronidazole therapy. Monitor INR every 2–3 days.',
    },
    {
        drugA: 'warfarin', drugB: 'amoxicillin-clavulanate', severity: 'high',
        mechanism: 'Disruption of gut flora reduces vitamin K production, potentiating warfarin anticoagulation.',
        recommendation: 'Monitor INR closely during and 5–7 days after antibiotic course.',
    },
    {
        drugA: 'digoxin', drugB: 'amiodarone', severity: 'high',
        mechanism: 'Amiodarone inhibits P-glycoprotein and CYP enzymes, dramatically increasing digoxin plasma levels and risk of toxicity.',
        recommendation: 'Reduce digoxin dose by 30–50% when initiating amiodarone. Monitor digoxin levels and ECG.',
    },
    {
        drugA: 'metformin', drugB: 'iodinated contrast media', severity: 'high',
        mechanism: 'Contrast may cause acute kidney injury, reducing metformin excretion and increasing lactic acidosis risk.',
        recommendation: 'Withhold metformin 48 hours before and after iodinated contrast administration. Check renal function before resuming.',
    },
    {
        drugA: 'phenytoin', drugB: 'ciprofloxacin', severity: 'high',
        mechanism: 'Ciprofloxacin can unpredictably increase or decrease phenytoin levels by affecting CYP2C9.',
        recommendation: 'Monitor phenytoin serum levels closely when ciprofloxacin is added or withdrawn.',
    },
    {
        drugA: 'tramadol', drugB: 'sertraline', severity: 'high',
        mechanism: 'Combined serotonergic activity can lead to serotonin syndrome (agitation, hyperthermia, clonus).',
        recommendation: 'Avoid combination. If required, use lowest effective doses and monitor for serotonin syndrome symptoms.',
    },
    {
        drugA: 'alprazolam', drugB: 'morphine', severity: 'high',
        mechanism: 'Combined CNS and respiratory depression can cause fatal respiratory compromise.',
        recommendation: 'Avoid concurrent use. If essential, use minimum effective doses, monitor respiratory rate closely.',
    },

    // ── MODERATE SEVERITY ─────────────────────────────────────────────────────
    {
        drugA: 'metformin', drugB: 'ibuprofen', severity: 'moderate',
        mechanism: 'NSAIDs may reduce renal blood flow, decreasing metformin clearance and increasing lactic acidosis risk.',
        recommendation: 'Use short-term NSAID only; monitor renal function. Prefer paracetamol for analgesia.',
    },
    {
        drugA: 'aspirin', drugB: 'ibuprofen', severity: 'moderate',
        mechanism: 'Ibuprofen competes with aspirin for COX-1 binding, attenuating the antiplatelet effect of low-dose aspirin.',
        recommendation: 'Take aspirin at least 2 hours before ibuprofen. Consider using paracetamol instead.',
    },
    {
        drugA: 'metoprolol', drugB: 'amlodipine', severity: 'moderate',
        mechanism: 'Additive negative chronotropic and inotropic effects may cause bradycardia or hypotension.',
        recommendation: 'Monitor heart rate and blood pressure at initiation. Typically a safe combination at appropriate doses.',
    },
    {
        drugA: 'amoxicillin', drugB: 'warfarin', severity: 'moderate',
        mechanism: 'Antibiotic alters gut flora, reducing vitamin K2 synthesis and enhancing anticoagulation.',
        recommendation: 'Monitor INR during and after amoxicillin course. Adjust warfarin if INR changes significantly.',
    },
    {
        drugA: 'ciprofloxacin', drugB: 'antacids', severity: 'moderate',
        mechanism: 'Divalent ions (Mg2+, Al3+, Ca2+) chelate ciprofloxacin in gut, reducing absorption by up to 90%.',
        recommendation: 'Take ciprofloxacin at least 2 hours before or 6 hours after antacid/calcium/iron products.',
    },
    {
        drugA: 'atorvastatin', drugB: 'amlodipine', severity: 'moderate',
        mechanism: 'Amlodipine inhibits CYP3A4, modestly increasing atorvastatin exposure.',
        recommendation: 'Limit atorvastatin dose to 20 mg/day when combined. Monitor for myopathy (muscle pain/weakness).',
    },
    {
        drugA: 'escitalopram', drugB: 'tramadol', severity: 'moderate',
        mechanism: 'Additive serotonergic effect increases risk of serotonin syndrome. Also, SSRIs inhibit CYP2D6 reducing tramadol analgesia.',
        recommendation: 'Monitor for serotonin syndrome. Consider alternative analgesic.',
    },
    {
        drugA: 'prednisolone', drugB: 'ibuprofen', severity: 'moderate',
        mechanism: 'Combined use greatly increases risk of GI ulceration, perforation, and bleeding.',
        recommendation: 'Add gastroprotective agent (PPI). Use minimum doses for shortest duration.',
    },
    {
        drugA: 'metoprolol', drugB: 'salbutamol', severity: 'moderate',
        mechanism: 'Beta-blockers attenuate the bronchodilatory and cardiac effect of beta-2 agonists.',
        recommendation: 'Prefer cardioselective beta-blockers (metoprolol) at low doses in asthma/COPD patients.',
    },
    {
        drugA: 'phenytoin', drugB: 'omeprazole', severity: 'moderate',
        mechanism: 'Omeprazole inhibits CYP2C19, increasing phenytoin plasma concentrations.',
        recommendation: 'Monitor phenytoin levels when omeprazole is started/stopped. Adjust phenytoin dose as needed.',
    },

    // ── LOW SEVERITY ──────────────────────────────────────────────────────────
    {
        drugA: 'omeprazole', drugB: 'metformin', severity: 'low',
        mechanism: 'Minimal clinically meaningful pharmacokinetic interaction.',
        recommendation: 'No dose adjustment required. Standard monitoring is sufficient.',
    },
    {
        drugA: 'amlodipine', drugB: 'atorvastatin', severity: 'low',
        mechanism: 'Minor CYP3A4 inhibition — small increase in statin exposure.',
        recommendation: 'No dose adjustment required at standard amlodipine doses (≤10 mg). Monitor for myopathy.',
    },
    {
        drugA: 'omeprazole', drugB: 'clopidogrel', severity: 'low',
        mechanism: 'Omeprazole inhibits CYP2C19 reducing clopidogrel conversion to active form, reducing antiplatelet effect.',
        recommendation: 'Consider pantoprazole as a safer PPI alternative with clopidogrel.',
    },
    {
        drugA: 'metformin', drugB: 'vitamin b12', severity: 'low',
        mechanism: 'Long-term metformin reduces vitamin B12 absorption in up to 30% of patients.',
        recommendation: 'Monitor B12 levels annually. Supplement if levels are low.',
    },
    {
        drugA: 'calcium carbonate', drugB: 'levothyroxine', severity: 'low',
        mechanism: 'Calcium reduces absorption of levothyroxine when taken simultaneously.',
        recommendation: 'Separate administration by at least 4 hours. Take levothyroxine on an empty stomach.',
    },
    {
        drugA: 'vitamin d3', drugB: 'calcium carbonate', severity: 'low',
        mechanism: 'Combination is generally beneficial; high doses of both may cause hypercalcemia.',
        recommendation: 'Monitor calcium levels if high doses are used. Combination is standard practice in osteoporosis.',
    },
    {
        drugA: 'dexamethasone', drugB: 'metformin', severity: 'low',
        mechanism: 'Corticosteroids raise blood glucose and may worsen diabetes control.',
        recommendation: 'Monitor blood glucose closely during steroid therapy; adjust metformin or add insulin if needed.',
    },
    {
        drugA: 'ranitidine', drugB: 'metformin', severity: 'low',
        mechanism: 'Ranitidine competes with metformin for renal tubular secretion, slightly increasing metformin levels.',
        recommendation: 'Monitor renal function; generally clinically insignificant at standard doses.',
    },
];

const seed = async (logger) => {
    let created = 0;
    for (const i of interactions) {
        await InteractionKB.findOneAndUpdate({ drugA: i.drugA, drugB: i.drugB }, i, { upsert: true });
        created++;
    }
    logger.info(`  ✔ Interaction KB: ${created} records seeded (${interactions.filter(x => x.severity === 'high').length} high, ${interactions.filter(x => x.severity === 'moderate').length} moderate, ${interactions.filter(x => x.severity === 'low').length} low severity)`);
};

module.exports = seed;
