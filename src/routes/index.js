import productsRout from './productsRout';
import categoriesRout from './categoriesRout';
import brandRout from './brandRout';
import sizeRout from './sizeRout';
import sizeTableRout from './sizeTableRout';
import quantityRout from './quantityRout';
import userRout from './userRout';
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

    app.get("*", (req, res) => {
        res.status(201).sendFile(path.resolve(__dirname, 'public', 'index.html'));
    });
};

export default addRoutes;