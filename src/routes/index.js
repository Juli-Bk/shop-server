import productsRout from './productsRout';
import categoriesRout from './categoriesRout';
import brandRout from './brandRout';
import sizeRout from './sizeRout';
import sizeTableRout from './sizeTableRout';
import quantityRout from './quantityRout';
import userRout from './userRout';

const addRoutes = (app) => {
    app.use('/products', productsRout);
    app.use('/categories', categoriesRout);
    app.use('/brands', brandRout);
    app.use('/sizes', sizeRout);
    app.use('/sizeTables', sizeTableRout);
    app.use('/quantity', quantityRout);
    app.use('/users', userRout);
};

export default addRoutes;