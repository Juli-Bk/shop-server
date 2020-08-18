import Color from '../models/schemas/Color';
import {log} from '../utils/helper';
import moment from 'moment';

export const addColor = (req, res, next) => {

    const data = {
        ...req.body,
        createdDate: moment.utc().format('MM-DD-YYYY'),
    };

    const newItem = new Color(data);
    newItem
        .save()
        .then(item => {
            const hex = item.hexBaseColor;
            return res
                .status(200)
                .json({
                    id: item._id,
                    name: item.name,
                    baseColorName: item.baseColorName,
                    hex,
                });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `New color adding error: ${error}`,
                    });
                next(error);
            },
        );
};

export const getAllColors = (req, res, next) => {
    Color
        .find({}, {_id: 1, name: 1, baseColorName: 1})
        .lean()
        .then(items => res.status(200).send({
            total: items.length,
            colors: items.map(item => {
                const hex = item.hexBaseColor;
                return {
                    id: item._id,
                    name: item.name,
                    baseColorName: item.baseColorName,
                    hex,
                    // additional
                    colorStr: item.name + '/' + item.baseColorName,
                };
            }),
        }))
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting colors list error: ${error}`,
                    });
                next(error);
            },
        );
};

export const getColorById = (req, res, next) => {
    const id = req.params.id;

    Color
        .findById(id)
        .lean()
        .then(item => {
            if (!item) {
                res.status(400)
                    .json({
                        message: `Color with id ${id} is not found`,
                    });
            } else {
                const hex = item.hexBaseColor;
                res.status(200).json({
                    id: item._id,
                    name: item.name,
                    baseColorName: item.baseColorName,
                    hex,
                    // additional
                    colorStr: item.name + '/' + item.baseColorName,
                });
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

export const updateColorById = (req, res, next) => {
    const id = req.params.id;

    const data = {
        ...req.body,
        updatedDate: moment.utc().format('MM-DD-YYYY'),
    };

    Color
        .findByIdAndUpdate(
            //filter
            id,
            //what we update
            {$set: data},
            //options. returns new updated data
            {new: true, runValidators: true},
        )
        .lean()
        .then(item => {
            if (!item) {
                res.status(200).json({
                    message: `Color with id ${id} is not found`,
                });
            } else {
                res.status(200).json(item);
            }
        })
        .catch(err => {
                res.status(400).json({
                    message: `Error happened on server: "${err.message}" `,
                });
                next(err);
            },
        );
};

export const deleteColorById = (req, res, next) => {
    const id = req.params.id;
    Color.findByIdAndRemove(id)
        .then((item) => {
            if (!item) {
                res.status(200).json({
                    message: `Color with id ${id} is not found`,
                });
            } else {
                res.status(200)
                    .json({
                        message: `Color with id ${req.params.id} is deleted`,
                    });
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete Color error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteAllColors = (req, res, next) => {
    Color.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all Colors are deleted',
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete Color list error "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};