import Category from '../models/Category';
import {log} from '../utils/helper';
import moment from "moment";

export const addCategory = (req, res, next) => {
    const filePath = req.file ? req.file.path : null;

    const data = {
        ...req.body,
        createdDate: moment.utc().format("MM-DD-YYYY"),
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
        .then(items => {

            const categories = items.map((current, index, array) => {
                const id = current._id.toString();
                current.children = array.filter((item => {
                    const parentId = item.parentId;
                    return parentId && (parentId.id.toString() === id)
                })).map(item => {
                    return {
                        id: item.id,
                        name: item.name,
                        breadcrumbs: item.categoryBreadcrumbs,
                        imageUrl: item.imageUrl,
                    }
                });
                return {
                    id: current.id,
                    name: current.name,
                    imageUrl: current.imageUrl,
                    breadcrumbs: current.categoryBreadcrumbs,
                    parentId: current.parentId,
                    children: current.children,
                    level: current.level
                };
            }).sort((a, b) => {
                return a.level - b.level;
            });

            const maxNestingLevel = Math.max(...categories.map(i => i.level));

            return res.status(200)
                .send({
                    categories: categories,
                    categoriesTotalCount: categories.length,
                    maxNestingLevel: maxNestingLevel
                });
        })
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
