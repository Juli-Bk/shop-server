import Brand from '../models/Brand';
import {log} from '../utils/helper';

export const addBrand = (req, res, next) => {
    const filePath = req.file ? req.file.path : null;

    const data = {
        ...req.body,
        imageUrl: filePath
    };

    const newItem = new Brand(data);
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
                        message: `New brand adding error: ${error}`
                    });
                next(error);
            }
        );
};

export const getAllBrands = (req, res, next) => {
    Brand
        .find()
        .then(items => res.send(items))
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting brands list error: ${error}`
                    });
                next(error);
            }
        );
};

export const getBrandById = (req, res, next) => {
    const id = req.params.id;

    Brand
        .findById(id)
        .then(item => {
            if (!item) {
                res.status(400)
                    .json({
                        message: `Brand with id ${id} is not found`
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

export const updateBrandById = (req, res, next) => {
    const id = req.params.id;

    const filePath = req.file ? req.file.path : null;

    const data = {
        ...req.body,
        imageUrl: filePath
    };

    Brand.findByIdAndUpdate(
        //filter
        id,
        //what we update
        {$set: data},
        //options. returns new updated data
        {new: true}
    )
        .then(item => {
            if (!item) {
                res.status(200).json({
                    message: `Brand with id ${id} is not found`
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

export const deleteBrandById = (req, res, next) => {
    const id = req.params.id;
    Brand.findByIdAndRemove(id)
        .then((item) => {
            if (!item) {
                res.status(200).json({
                    message: `Brand with id ${id} is not found`
                });
            } else {
                res.status(200)
                    .json({
                        message: `Brand with id ${req.params.id} is deleted`
                    });
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete Brand error: "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const deleteAllBrands = (req, res, next) => {
    Brand.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all brands are deleted'
            })
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete brand list error "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};