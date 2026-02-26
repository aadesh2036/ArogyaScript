const bcrypt = require('bcryptjs');
const User = require('../../modules/auth/model');

const rawUsers = [
    { name: 'Admin User', email: 'admin@arogyascript.ai', password: 'Admin@1234', role: 'admin' },
    { name: 'Dr. Anika Sharma', email: 'doctor@arogyascript.ai', password: 'Doctor@1234', role: 'doctor' },
    { name: 'Pharmacist Rahul', email: 'pharmacy@arogyascript.ai', password: 'Pharma@1234', role: 'pharmacist' },
    { name: 'Patient Priya', email: 'patient@arogyascript.ai', password: 'Patient@1234', role: 'patient' },
    { name: 'Dr. Vikram Nair', email: 'vikram@arogyascript.ai', password: 'Doctor@5678', role: 'doctor' },
];

const seed = async (logger) => {
    let count = 0;
    for (const u of rawUsers) {
        const exists = await User.findOne({ email: u.email });
        if (exists) continue;
        const passwordHash = await bcrypt.hash(u.password, 12);
        await User.create({ name: u.name, email: u.email, passwordHash, role: u.role });
        count++;
    }
    logger.info(`  ✔ Users: ${count} new, ${rawUsers.length - count} already exist`);
};

module.exports = seed;
