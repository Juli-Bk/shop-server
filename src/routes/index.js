import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import productsRoute from './routers/productsRoute';
import categoriesRoute from './routers/categoriesRoute';
import brandRoute from './routers/brandRoute';
import sizeRoute from './routers/sizeRoute';
import sizeTableRoute from './routers/sizeTableRoute';
import quantityRoute from './routers/quantityRoute';
import userRoute from './routers/userRoute';
import subscriberRoute from './routers/subscriberRoute';
import wishListRoute from './routers/wishListRoute';
import colorRoute from './routers/colorRoute';
import importRoute from './routers/importRoute';
import shopCartRoute from './routers/shopCartRoute';
import orderRout from './routers/orderRoute';
import mailRout from './routers/mailRout';

const __dirname = path.resolve();

const addRoutes = (app) => {
  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

  app.use('/products', productsRoute);
  app.use('/categories', categoriesRoute);
  app.use('/brands', brandRoute);
  app.use('/sizes', sizeRoute);
  app.use('/sizeTables', sizeTableRoute);
  app.use('/quantity', quantityRoute);
  app.use('/users', userRoute);
  app.use('/subscribers', subscriberRoute);
  app.use('/wishlist', wishListRoute);
  app.use('/colors', colorRoute);
  app.use('/cart', shopCartRoute);
  app.use('/orders', orderRout);
  app.use('/mail', mailRout);

  app.use('/import-data', importRoute);

  app.use('/uploads', express.static('uploads'));

  app.get('*', (req, res) => {
    res.status(201).sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
};

export default addRoutes;
