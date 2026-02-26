const Prescription = require('../models/Prescription.model');

// GET /api/dashboard/stats
exports.getStats = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user._id });

    const total = prescriptions.length;
    const avgRisk =
      total > 0
        ? Math.round(prescriptions.reduce((s, p) => s + (p.riskScore?.overall || 0), 0) / total)
        : 0;

    const riskDistribution = { safe: 0, low: 0, moderate: 0, high: 0, critical: 0 };
    const drugCount = {};
    let interactionsDetected = 0;

    prescriptions.forEach((p) => {
      const level = p.riskScore?.level || 'safe';
      riskDistribution[level] = (riskDistribution[level] || 0) + 1;
      interactionsDetected += p.interactions?.length || 0;

      p.extractedEntities?.forEach((e) => {
        drugCount[e.drugName] = (drugCount[e.drugName] || 0) + 1;
      });
    });

    const commonDrugs = Object.entries(drugCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalPrescriptions: total,
        avgRiskScore: avgRisk,
        riskDistribution,
        commonDrugs,
        interactionsDetected,
      },
    });
  } catch (err) {
    next(err);
  }
};
