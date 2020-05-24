import productsRoute from './productsRoute';
import categoriesRoute from './categoriesRoute';
import brandRoute from './brandRoute';
import sizeRoute from './sizeRoute';
import sizeTableRoute from './sizeTableRoute';
import quantityRoute from './quantityRoute';
import userRoute from './userRoute';
import importRoute from './importRoute';
import express from 'express';
import path from 'path';
import favicon from "serve-favicon";

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

    app.use('/import-data', importRoute);

    app.use('/uploads', express.static('uploads'));

    app.get("*", (req, res) => {
        res.status(201).sendFile(path.resolve(__dirname, 'public', 'index.html'));
    });
};

export default addRoutes;