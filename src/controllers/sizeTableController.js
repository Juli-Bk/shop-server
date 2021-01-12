import SizeTable from '../models/schemas/SizeTable';
import { log, getFormattedCurrentDate } from '../helpers/helper';
import { validateObjectId } from '../helpers/filterParamsHelper';

export const addSizeTable = async (req, res) => {
  const data = {
    ...req.body,
    createdDate: getFormattedCurrentDate(),
  };

  try {
    const item = new SizeTable(data).save();
    return res.status(200).json({
      message: 'success',
      item,
    });
  } catch (error) {
    log(error.message);
    return res.status(400).json({
      message: `New SizeTable adding error: ${error}`,
    });
  }
};

export const getAllSizeTables = async (req, res) => {
  try {
    const items = await SizeTable.find().lean();
    log(`total size table count: ${items.length}`);
    return res.status(200).send(items);
  } catch (error) {
    log(error.message);
    return res.status(400).json({
      message: `Getting SizeTables list error: ${error}`,
    });
  }
};

// ^_: only find a content starts with _
// \$: only find the single "$" in a content
const isNotMongoProp = (key) => !/^_/i.test(key) && !/\$/.test(key);
const isMeasurement = (key) => {
  const notMeasurements = ['productId', 'sizeId', 'createdDate', 'updatedDate', '_id'];
  return !notMeasurements.includes(key) && isNotMongoProp(key);
};

export const getSizeTableByProductId = async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id)) {
    return res.status(400).json({
      message: 'invalid product id',
    });
  }

  try {
    const items = await SizeTable.find({ productId: id });
    if (!items) {
      return res.status(400).json({
        message: `SizeTable with id ${id} is not found`,
      });
    }

    try {
      const sizes = items.map((item) => {
        const filtered = [];

        // eslint-disable-next-line no-restricted-syntax
        for (const [key, value] of Object.entries(item._doc)) {
          if (isMeasurement(key)) {
            if (Object.keys(value).length > 0) {
              filtered.push({ [key]: value });
            }
          }
        }

        const { sizeId } = item;
        return {
          sizeId,
          measurements: filtered,
        };
      });

      return res.status(200).json(sizes);
    } catch (error) {
      log(error.message);
      return res.status(400).json({
        message: `getting sizeTable error: ${error.message}`,
      });
    }
  } catch (error) {
    log(error.message);
    return res.status(400).json({
      message: `Error happened on server: ${error}`,
    });
  }
};

export const updateSizeTableById = async (req, res) => {
  const { id } = req.params;
  const data = {
    ...req.body,
    updatedDate: getFormattedCurrentDate(),
  };
  try {
    const item = await SizeTable.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!item) {
      return res.status(200).json({
        message: `SizeTable with id ${id} is not found`,
      });
    }

    return res.status(200).json(item);
  } catch (error) {
    log(error.message);
    return res.status(400).json({
      message: `Error happened on server: "${error}" `,
    });
  }
};

export const deleteSizeTableById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await SizeTable.findByIdAndRemove(id);
    if (!item) {
      return res.status(200).json({
        message: `SizeTable with id ${id} is not found`,
      });
    }

    return res.status(200).json({
      message: `SizeTable with id ${req.params.id} is deleted`,
    });
  } catch (error) {
    log(error.message);
    return res.status(400).json({
      message: `delete SizeTable error: "${error.message}" `,
    });
  }
};

export const deleteAllSizeTables = async (req, res) => {
  try {
    await SizeTable.deleteMany({});
    return res.status(200).json({
      message: 'all SizeTables are deleted',
    });
  } catch (error) {
    log(error.message);
    return res.status(400).json({
      message: `delete SizeTable list error "${error.message}" `,
    });
  }
};
