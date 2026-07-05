const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/api-response');

const login = async (req, res) => {
  const session = await authService.login(req.body);
  sendSuccess(res, session, 'Login successful');
};

const logout = async (req, res) => {
  await authService.logout(req.user);
  sendSuccess(res, null, 'Logout successful');
};

const getProfile = async (req, res) => {
  sendSuccess(res, {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    permissions: req.user.permissions
  });
};

module.exports = {
  login,
  logout,
  getProfile
};

