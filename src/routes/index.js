import productsRout from './productsRoute';
import categoriesRout from './categoriesRoute';
import brandRout from './brandRoute';
import sizeRout from './sizeRoute';
import sizeTableRout from './sizeTableRoute';
import quantityRout from './quantityRoute';
import userRout from './userRoute';
import importRout from './importRoute';
import express from 'express';
import path from 'path';
import favicon from "serve-favicon";

const __dirname = path.resolve();

const addRoutes = (app) => {
    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

    app.use('/products', productsRout);
    app.use('/categories', categoriesRout);
    app.use('/brands', brandRout);
    app.use('/sizes', sizeRout);
    app.use('/sizeTables', sizeTableRout);
    app.use('/quantity', quantityRout);
    app.use('/users', userRout);

    app.use('/import-data', importRout);

    app.use('/uploads', express.static('uploads'));

    app.get("*", (req, res) => {
        res.status(201).sendFile(path.resolve(__dirname, 'public', 'index.html'));
    });
};

export default addRoutes;