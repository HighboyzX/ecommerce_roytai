const Express = require('express');
const Router = Express.Router();

const { create, fetch, del } = require('../controllers/category');

// @ENGPOINT http://localhost:5001/api/category

Router.post('/category', create);
Router.get('/category',fetch);
Router.delete('/category/:id',del);

module.exports = Router;