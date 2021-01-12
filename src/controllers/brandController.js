import Brand from '../models/schemas/Brand';
import { log, getFormattedCurrentDate } from '../helpers/helper';

export const addBrand = async (req, res) => {
  const filePath = req.file ? req.file.path : null;

  const data = {
    ...req.body,
    createdDate: getFormattedCurrentDate(),
    imageUrl: filePath,
  };

  try {
    const newBrand = await new Brand(data).save();
    return res.status(200).json({
      message: 'success',
      newBrand,
    });
  } catch (e) {
    const message = `New brand adding error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const getAllBrands = async (req, res) => {
  try {
    const items = await Brand.find().lean();
    return res.status(200).send({
      count: items.length,
      items,
    });
  } catch (e) {
    const message = `Getting brands list error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const getBrandById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Brand
      .findById(id)
      .lean();
    if (!item) {
      return res.status(400)
        .json({
          message: `Brand with id ${id} is not found`,
        });
    }

    return res.status(200).json(item);
  } catch (e) {
    const message = `Getting brand by id error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const updateBrandById = async (req, res) => {
  const { id } = req.params;

  const filePath = req.file ? req.file.path : null;

  const data = {
    ...req.body,
    updatedDate: getFormattedCurrentDate(),
    imageUrl: filePath,
  };

  try {
    const item = await Brand.findByIdAndUpdate(
      id, // filter
      { $set: data }, // what we update
      { new: true, runValidators: true }, // options. returns new updated data
    ).lean();
    if (!item) {
      return res.status(200).json({
        message: `Brand with id ${id} is not found`,
      });
    }

    return res.status(200).json(item);
  } catch (e) {
    const message = `Updating brand by id error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const deleteBrandById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Brand.findByIdAndRemove(id);
    if (!item) {
      return res.status(200).json({
        message: `Brand with id ${id} is not found`,
      });
    }

    return res.status(200)
      .json({
        message: `Brand with id ${req.params.id} is deleted`,
      });
  } catch (e) {
    const message = `Deleting brand by id error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const deleteAllBrands = async (req, res) => {
  try {
    await Brand.deleteMany({});

    return res.status(200).json({
      message: 'all brands are deleted',
    });
  } catch (e) {
    const message = `Deleting brands list error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};
