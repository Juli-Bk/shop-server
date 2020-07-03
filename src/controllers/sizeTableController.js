import SizeTable from '../models/schemas/SizeTable';
import {log} from '../utils/helper';
import moment from 'moment';

export const addSizeTable = (req, res, next) => {
    const data = {
        ...req.body,
        createdDate: moment.utc().format('MM-DD-YYYY'),
    };

    const newItem = new SizeTable(data);
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
                        message: `New SizeTable adding error: ${error}`,
                    });
                next(error);
            },
        );
};

export const getAllSizeTables = (req, res, next) => {
    SizeTable
        .find()
        .then(items => res.status(200).send(items))
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting SizeTables list error: ${error}`,
                    });
                next(error);
            },
        );
};

export const getSizeTableByProductId = (req, res, next) => {
    const id = req.params.id;

    const notMeasurments = ['productId', 'sizeId', 'createdDate', 'updatedDate', '_id'];

    SizeTable
        .find({productId: id})
        .then(items => {
            if (!items) {
                return res.status(400)
                    .json({
                        message: `SizeTable with id ${id} is not found`,
                    });
            } else {

                try {
                    const sizes = items.map(item => {

                        const filtered = [];

                        for (const [key, value] of Object.entries(item._doc)) {
                            if (!notMeasurments.includes(key) && !/^_/i.test(key) && !/\$/.test(key)) {
                                if (Object.keys(value).length > 0) {
                                    filtered.push({[key]: value});
                                }
                            }
                        }

                        const {sizeId} = item;
                        return {
                            sizeId,
                            measurements: filtered,
                        };
                    });

                    return res.status(200).json({
                        items,
                        sizes,
                    });
                } catch (error) {
                    return res.status(400).json({
                        message: `getting sizeTable error: ${error.message}`,
                    });
                }
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

export const updateSizeTableById = (req, res, next) => {
    const id = req.params.id;

    SizeTable.findByIdAndUpdate(
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
                    message: `SizeTable with id ${id} is not found`,
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

export const deleteSizeTableById = (req, res, next) => {
    const id = req.params.id;
    SizeTable.findByIdAndRemove(id)
        .then((item) => {
            if (!item) {
                res.status(200).json({
                    message: `SizeTable with id ${id} is not found`,
                });
            } else {
                res.status(200)
                    .json({
                        message: `SizeTable with id ${req.params.id} is deleted`,
                    });
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete SizeTable error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteAllSizeTables = (req, res, next) => {
    SizeTable.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all SizeTables are deleted',
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete SizeTable list error "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};