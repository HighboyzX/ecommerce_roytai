const Express = require('express');
const Router = Express.Router();

const { register, login, currentUser } = require('../controllers/auth');

// @ENGPOINT http://localhost:5001/api/register

Router.post('/register', register);
Router.post('/login', login);
Router.post('/current-user', currentUser);
Router.post('/current-admin', currentUser);

module.exports = Router;