const Express = require('express');
const Router = Express.Router();

const { create, del, update, fetchLimit, fetchOne, fetchSort, fetchFilter } = require('../controllers/product');

// @ENGPOINT http://localhost:5001/api/product

Router.post('/product',create);
Router.put('/product/:id', update);
Router.delete('/product/:id', del);
Router.get('/product-limit/:limit',fetchLimit);
Router.get('/product-one/:id',fetchOne);
Router.post('/product-sort',fetchSort);
Router.post('/product-filter/',fetchFilter);

module.exports = Router;