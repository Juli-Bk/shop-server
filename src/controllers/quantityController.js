import Quantity from '../models/schemas/Quantity';
import { log, getFormattedCurrentUTCDate } from '../helpers/helper';
import { validateObjectId } from '../helpers/filterParamsHelper';

export const addQuantity = async (req, res) => {
  const data = {
    ...req.body,
    createdDate: getFormattedCurrentUTCDate(),
  };

  if (!data.productId && !validateObjectId(data.productId)) {
    return res.status(400).json({ message: 'invalid product Id' });
  }

  if ('colorId' in data && !validateObjectId(data.colorId)) {
    return res.status(400).json({ message: 'invalid color Id' });
  }

  if (!data.sizeId && !validateObjectId(data.sizeId)) {
    return res.status(400).json({ message: 'invalid size Id' });
  }

  try {
    const item = await new Quantity(data).save();
    return res.status(200).json({ item });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `New Quantity adding error: ${error.message}`,
    });
  }
};

export const getAllQuantity = async (req, res) => {
  try {
    const items = await Quantity.find().lean();
    return res.status(200).json({
      count: items.length,
      items,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Getting Quantity list error: ${error}`,
    });
  }
};

export const getQuantityByProductId = async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'invalid product Id' });
  }

  try {
    const item = await Quantity.find({ productId: id });
    if (!item.length) {
      return res.status(400).json({
        message: `Quantity for product with id: ${id} is not found`,
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

export const updateQuantityById = async (req, res) => {
  const { id } = req.params;
  const data = {
    ...req.body,
    updatedDate: getFormattedCurrentUTCDate(),
  };

  if ('productId' in data && !validateObjectId(data.productId)) {
    return res.status(400).json({ message: 'invalid product Id' });
  }

  if ('colorId' in data && !validateObjectId(data.colorId)) {
    return res.status(400).json({ message: 'invalid color Id' });
  }

  if ('sizeId' in data && !validateObjectId(data.sizeId)) {
    return res.status(400).json({ message: 'invalid size Id' });
  }

  try {
    const item = await Quantity.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!item) {
      return res.status(200).json({
        message: `Quantity with id ${id} is not found`,
      });
    }

    return res.status(200).json(item);
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const deleteQuantityById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Quantity.findByIdAndRemove(id).lean();
    if (!item) {
      return res.status(200).json({
        message: `Quantity with id ${id} is not found`,
      });
    }

    return res.status(200).json({
      message: `Quantity with id ${id} is deleted`,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete Quantity error: "${error.message}" `,
    });
  }
};

export const deleteAllQuantities = async (req, res) => {
  try {
    await Quantity.deleteMany({});
    return res.status(200).json({
      message: 'all Quantity data are deleted',
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete Quantity list error "${error.message}" `,
    });
  }
};
