const userService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.json({ success: true, count: users.length, data: users });
});

const getOne = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
});

const update = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user });
});

const remove = asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted' });
});

module.exports = { getAll, getOne, update, remove };
