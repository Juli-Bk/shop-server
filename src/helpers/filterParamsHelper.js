import mongoose from 'mongoose';
import moment from 'moment';
import { log } from './helper';

const excludedParams = [
  'perPage', 'startPage',
  'minPrice', 'maxPrice', 'sort',
  'minCreatedDate', 'maxCreatedDate',
  'color', 'size', 'isNewIn', 'new',
];

const { Types: { ObjectId } } = mongoose;
export const validateObjectId = (id) => ObjectId.isValid(id)
  && (new ObjectId(id)).toString() === id;

const filterParser = (filtersQueryString) => {
  const mongooseQuery = {};

  if (filtersQueryString.minPrice && filtersQueryString.maxPrice) {
    mongooseQuery.price = {
      $gt: Number(filtersQueryString.minPrice),
      $lt: Number(filtersQueryString.maxPrice),
    };
  } else if (filtersQueryString.minPrice) {
    mongooseQuery.price = {
      $gt: Number(filtersQueryString.minPrice),
    };
  } else if (filtersQueryString.maxPrice) {
    mongooseQuery.price = {
      $lt: Number(filtersQueryString.maxPrice),
    };
  }

  if (filtersQueryString.minCreatedDate || filtersQueryString.maxCreatedDate) {
    const minDate = moment.utc(filtersQueryString.minCreatedDate);
    const maxDate = moment.utc(filtersQueryString.maxCreatedDate);
    mongooseQuery.createdDate = {
      $gte: minDate,
      $lte: maxDate,
    };
  }

  return Object.keys(filtersQueryString)
    .reduce((mQuery, filterParam) => {
      const query = { ...mQuery };
      const parameterValue = filtersQueryString[filterParam];
      if (!excludedParams.includes(filterParam)
                && parameterValue.includes
                && parameterValue.includes(',')) {
        query[filterParam] = {
          $in: filtersQueryString[filterParam]
            .split(',')
            .map((item) => {
              const decoded = decodeURI(item.trim());
              if (validateObjectId(decoded)) {
                return decodeURI(decoded);
              }

              return new RegExp(decoded, 'i');
            }),
        };
      } else if (!excludedParams.includes(filterParam)) {
        const filterValue = filtersQueryString[filterParam];
        const decoded = decodeURI(filterValue.trim());
        const isValidId = validateObjectId(decoded);

        try {
          const isBooleanFilter = decoded === 'true' || decoded === 'false';

          if (isValidId || isBooleanFilter) {
            query[filterParam] = decoded;
          } else {
            query[filterParam] = {
              $regex: decoded,
            };
          }
        } catch (e) {
          log(Array(100).join('_'));
          log('error: ', e);
          log('filterValue: ', filterValue);
          log('decoded: ', decoded);
          log(Array(100).join('_'));
        }
      }

      return query;
    }, mongooseQuery);
};

export default filterParser;
