/**
 * Mock ML Pipeline — returns realistic dummy analysis data.
 * Replaced with real ML service call in Round-2 integration.
 */

const MOCK_DRUGS = [
  { drugName: 'Amoxicillin', dosage: '500mg', frequency: 'TDS (three times daily)', duration: '7 days' },
  { drugName: 'Ibuprofen', dosage: '400mg', frequency: 'BD (twice daily)', duration: '5 days' },
  { drugName: 'Metformin', dosage: '500mg', frequency: 'OD (once daily)', duration: '30 days' },
  { drugName: 'Paracetamol', dosage: '650mg', frequency: 'TDS', duration: '3 days' },
  { drugName: 'Cetirizine', dosage: '10mg', frequency: 'OD', duration: '10 days' },
  { drugName: 'Omeprazole', dosage: '20mg', frequency: 'OD (before breakfast)', duration: '14 days' },
  { drugName: 'Atorvastatin', dosage: '10mg', frequency: 'OD (at night)', duration: '90 days' },
  { drugName: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: '30 days' },
];

const MOCK_INTERACTIONS = [
  {
    drug1: 'Ibuprofen',
    drug2: 'Metformin',
    severity: 'moderate',
    description: 'NSAIDs may enhance the hypoglycemic effect of Metformin.',
    recommendation: 'Monitor blood glucose levels closely.',
  },
  {
    drug1: 'Ibuprofen',
    drug2: 'Amlodipine',
    severity: 'low',
    description: 'NSAIDs may reduce antihypertensive effect.',
    recommendation: 'Monitor blood pressure.',
  },
  {
    drug1: 'Amoxicillin',
    drug2: 'Metformin',
    severity: 'low',
    description: 'Possible altered absorption.',
    recommendation: 'Space doses by 2 hours if possible.',
  },
];

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateMockAnalysis(prescriptionId) {
  const drugCount = 2 + Math.floor(Math.random() * 3); // 2-4 drugs
  const entities = pickRandom(MOCK_DRUGS, drugCount).map((d) => ({
    ...d,
    rawText: `${d.drugName} ${d.dosage}`,
    confidence: +(0.8 + Math.random() * 0.2).toFixed(2),
  }));

  const drugNames = entities.map((e) => e.drugName);

  // Filter interactions relevant to selected drugs
  const interactions = MOCK_INTERACTIONS.filter(
    (i) => drugNames.includes(i.drug1) && drugNames.includes(i.drug2)
  );

  // Compute risk
  let overall = 0;
  const signals = [];

  if (interactions.length > 0) {
    const interactionWeight = interactions.reduce(
      (s, i) => s + (i.severity === 'critical' ? 40 : i.severity === 'high' ? 30 : i.severity === 'moderate' ? 20 : 10),
      0
    );
    overall += interactionWeight;
    signals.push({
      signal: 'drug_interaction',
      weight: interactionWeight,
      detail: `${interactions.length} interaction(s) detected`,
    });
  }

  if (drugCount >= 3) {
    overall += 10;
    signals.push({ signal: 'polypharmacy', weight: 10, detail: `${drugCount} drugs prescribed` });
  }

  overall = Math.min(overall, 100);
  const level =
    overall <= 10 ? 'safe' : overall <= 25 ? 'low' : overall <= 50 ? 'moderate' : overall <= 75 ? 'high' : 'critical';

  return {
    patientInfo: { name: 'Demo Patient', age: 45, gender: 'M' },
    extractedEntities: entities,
    interactions,
    riskScore: { overall, level, signals },
    metadata: {
      ocrEngine: 'MockPipeline',
      processingTimeMs: 500 + Math.floor(Math.random() * 2000),
      imageQuality: ['good', 'fair', 'excellent'][Math.floor(Math.random() * 3)],
    },
  };
}

module.exports = { generateMockAnalysis };
