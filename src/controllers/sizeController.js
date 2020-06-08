import Size from '../models/schemas/Size';
import {getRandomItemId, log} from '../utils/helper';
import moment from 'moment';

export const addSize = (req, res, next) => {
    const data = {
        ...req.body,
        createdDate: moment.utc().format('MM-DD-YYYY'),
        itemId: getRandomItemId(),
    };

    const newItem = new Size(data);
    newItem
        .save()
        .then(item => res
            .status(200)
            .json({
                message: 'success',
                item,
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `New Size adding error: ${error}`,
                    });
                next(error);
            },
        );
};

export const getAllSizes = (req, res, next) => {
    Size
        .find()
        .then(items => res.status(200).json({
            count: items.length,
            items,
        }))
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting Sizes list error: ${error}`,
                    });
                next(error);
            },
        );
};

export const getSizeById = (req, res, next) => {
    const id = req.params.id;

    Size
        .findById(id)
        .then(item => {
            if (!item) {
                res.status(400)
                    .json({
                        message: `Size with id ${id} is not found`,
                    });
            } else {
                res.status(200).json(item);
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Error happened on server: "${error}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const updateSizeById = (req, res, next) => {
    const id = req.params.id;

    Size.findByIdAndUpdate(
        //filter
        id,
        //what we update
        {$set: {...req.body, updatedDate: moment.utc().format('MM-DD-YYYY')}},
        //options. returns new updated data
        {new: true, runValidators: true},
    )
        .then(item => {
            if (!item) {
                res.status(200).json({
                    message: `Size with id ${id} is not found`,
                });
            } else {
                res.status(200).json(item);
            }
        })
        .catch(err => {
                res.status(400).json({
                    message: `Error happened on server: "${err}" `,
                });
                next(err);
            },
        );
};

export const deleteSizeById = (req, res, next) => {
    const id = req.params.id;
    Size.findByIdAndRemove(id)
        .then((item) => {
            if (!item) {
                res.status(200).json({
                    message: `Size with id ${id} is not found`,
                });
            } else {
                res.status(200)
                    .json({
                        message: `Size with id ${req.params.id} is deleted`,
                    });
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete Size error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteAllSizes = (req, res, next) => {
    Size.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all Sizes are deleted',
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete Size list error "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};