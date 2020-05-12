import Quantity from '../models/Quantity';
import {getRandomItemId, log} from '../utils/helper';

export const addQuantity = (req, res, next) => {
    const data = {...req.body, itemId: getRandomItemId()};

    const newItem = new Quantity(data);
    newItem
        .save()
        .then(item => res
            .status(200)
            .json({
                message: 'success',
                item
            })
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `New Quantity adding error: ${error}`
                    });
                next(error);
            }
        );
};

export const getAllQuantity = (req, res, next) => {
    Quantity
        .find()
        .then(items => res.send(items))
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting Quantity list error: ${error}`
                    });
                next(error);
            }
        );
};

export const getQuantityById = (req, res, next) => {
    const id = req.params.id;

    Quantity
        .findById(id)
        .then(item => {
            if (!item) {
                res.status(400)
                    .json({
                        message: `Quantity with id ${id} is not found`
                    });
            } else {
                res.status(200).json(item);
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Error happened on server: "${error}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const updateQuantityById = (req, res, next) => {
    const id = req.params.id;

    Quantity.findByIdAndUpdate(
        //filter
        id,
        //what we update
        {$set: req.body},
        //options. returns new updated data
        {new: true}
    )
        .then(item => {
            if (!item) {
                res.status(200).json({
                    message: `Quantity with id ${id} is not found`
                });
            } else {
                res.status(200).json(item);
            }
        })
        .catch(err => {
                res.status(400).json({
                    message: `Error happened on server: "${err}" `
                });
                next(err);
            }
        );
};

export const deleteQuantityById = (req, res, next) => {
    const id = req.params.id;
    Quantity.findByIdAndRemove(id)
        .then((item) => {
            if (!item) {
                res.status(200).json({
                    message: `Quantity with id ${id} is not found`
                });
            } else {
                res.status(200)
                    .json({
                        message: `Quantity with id ${req.params.id} is deleted`
                    });
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete Quantity error: "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const deleteAllQuantitys = (req, res, next) => {
    Quantity.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all Quantity data are deleted'
            })
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete Quantity list error "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};