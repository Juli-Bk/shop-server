import Category from '../models/Category';
import {log} from '../utils/helper';
import moment from "moment";

export const addCategory = (req, res, next) => {
    const filePath = req.file ? req.file.path : null;

    const data = {
        ...req.body,
        createdDate: moment.utc().format( "MM-DD-YYYY"),
        imageUrl: filePath
    };
    const newItem = new Category(data);
    newItem
        .save()
        .then(product => res
            .status(200)
            .json({
                message: 'success',
                product
            })
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `New category adding error: ${error}`
                    });
                next(error);
            }
        );
};

export const getAllCategories = (req, res, next) => {
    Category
        .find()
        .then(items => res.status(200).send(items))
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting categories error: ${error}`
                    });
                next(error);
            }
        );
};

export const getCategoryById = (req, res, next) => {
    const categoryId = req.params.id;

    Category
        .findById(categoryId)
        .then(category => {
            if (!category) {
                res.status(400)
                    .json({
                        message: `Category with id ${categoryId} is not found`
                    });
            } else {
                res.status(200).json(category);
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

export const updateCategoryById = (req, res, next) => {
    const categoryId = req.params.id;
    const filePath = req.file ? req.file.path : null;

    const data = {
        ...req.body,
        updatedDate: moment.utc().format("MM-DD-YYYY"),
        imageUrl: filePath
    };

    Category.findByIdAndUpdate(
        //filter
        categoryId,
        //what we update
        {$set: data},
        //options. returns new updated data
        {new: true, runValidators: true}
    )
        .then(category => {
            if (!category) {
                res.status(200).json({
                    message: `Category with id ${categoryId} is not found`
                });
            } else {
                res.status(200).json(category);
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

export const deleteCategoryById = (req, res, next) => {
    const categoryId = req.params.id;
    Category.findByIdAndRemove(categoryId)
        .then((category) => {
            if (!category) {
                res.status(200).json({
                    message: `Category with id ${categoryId} is not found`
                });
            } else {
                res.status(200)
                    .json({
                        message: `Category with id ${req.params.id} is deleted`
                    });
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete category error: "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const deleteAllCategories = (req, res, next) => {
    Category.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all categories are deleted'
            })
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete categories error "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};
