const User = require('./model');
const APIError = require('../../utils/apiError');

const getAllUsers = async () => User.find().select('-passwordHash');

const getUserById = async (id) => {
    const user = await User.findById(id).select('-passwordHash');
    if (!user) throw APIError.notFound('User not found');
    return user;
};

const updateUser = async (id, updates) => {
    const forbidden = ['passwordHash', 'email'];
    forbidden.forEach((f) => delete updates[f]);
    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) throw APIError.notFound('User not found');
    return user;
};

const deleteUser = async (id) => {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw APIError.notFound('User not found');
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
