import mongoose from 'mongoose';

const excludedParams = ['perPage', 'startPage', 'minPrice', 'maxPrice', 'sort'];

const {Types: {ObjectId}} = mongoose;
const validateObjectId = (id) => ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;

const filterParser = (filtersQueryString) => {
    const mongooseQuery = {};

    if (filtersQueryString.minPrice || filtersQueryString.maxPrice) {
        mongooseQuery.currentPrice = {
            $gt: Number(filtersQueryString.minPrice),
            $lt: Number(filtersQueryString.maxPrice)
        };
    }

    return Object.keys(filtersQueryString).reduce(
        (mongooseQuery, filterParam) => {
            const parameterValue = filtersQueryString[filterParam];
            if (parameterValue.includes && parameterValue.includes(',')) {
                mongooseQuery[filterParam] = {
                    $in: filtersQueryString[filterParam]
                        .split(',')
                        .map(item => {
                            const decoded = decodeURI(item.trim());
                            if (validateObjectId(decoded)) {
                                return decodeURI(decoded);
                            }
                            return new RegExp(decoded, 'i');
                        })
                };
            } else if (!excludedParams.includes(filterParam)) {
                const filterValue = filtersQueryString[filterParam];
                const decoded = decodeURI(filterValue.trim());

                if (validateObjectId(decoded)) {
                    mongooseQuery[filterParam] = decoded;
                } else {
                    mongooseQuery[filterParam] = {
                        $regex: decoded
                    };
                }
            }
            return mongooseQuery;
        },
        mongooseQuery
    );
};

export default filterParser;
