import Size from '../models/schemas/Size';
import { log, getFormattedCurrentDate } from '../helpers/helper';

export const addSize = async (req, res) => {
  const data = {
    ...req.body,
    createdDate: getFormattedCurrentDate(),
  };

  try {
    const item = await new Size(data).save();
    return res.status(200).json({
      message: 'success',
      item,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `New Size adding error: ${error}`,
    });
  }
};

export const getAllSizes = async (req, res) => {
  try {
    const items = await Size.find({}, { _id: 1, name: 1, sizeType: 1 }).lean();
    return res.status(200).json({
      count: items.length,
      items,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Getting Sizes list error: ${error}`,
    });
  }
};

export const getSizeById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Size.findById(id, { _id: 1, name: 1, sizeType: 1 }).lean();
    if (!item) {
      return res.status(400).json({
        message: `Size with id ${id} is not found`,
      });
    }

    return res.status(200).json(item);
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Error happened on server: "${error}" `,
    });
  }
};

export const updateSizeById = async (req, res) => {
  const { id } = req.params;
  const data = {
    ...req.body,
    updatedDate: getFormattedCurrentDate(),
  };

  try {
    const item = await Size.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!item) {
      return res.status(200).json({
        message: `Size with id ${id} is not found`,
      });
    }

    return res.status(200).json(item);
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Error happened on server: "${error}" `,
    });
  }
};

export const deleteSizeById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Size.findByIdAndRemove(id).lean();
    if (!item) {
      return res.status(200).json({
        message: `Size with id ${id} is not found`,
      });
    }

    return res.status(200).json({
      message: `Size with id ${req.params.id} is deleted`,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete Size error: "${error.message}" `,
    });
  }
};

export const deleteAllSizes = async (req, res) => {
  try {
    await Size.deleteMany({});
    return res.status(200).json({
      message: 'all Sizes are deleted',
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete Size list error "${error.message}" `,
    });
  }
};
