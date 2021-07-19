import Color from '../models/schemas/Color';
import { log, getFormattedCurrentUTCDate } from '../helpers/helper';
import { validateObjectId } from '../helpers/filterParamsHelper';

export const addColor = async (req, res) => {
  const data = {
    ...req.body,
    createdDate: getFormattedCurrentUTCDate(),
  };

  try {
    const item = await new Color(data).save();
    const hex = item.hexBaseColor;
    return res
      .status(200)
      .json({
        id: item._id,
        name: item.name,
        baseColorName: item.baseColorName,
        hex,
      });
  } catch (e) {
    const message = `New color adding error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const getAllColors = async (req, res) => {
  try {
    const items = await Color.find({}, { _id: 1, name: 1, baseColorName: 1 }).lean();
    return res.status(200).send({
      total: items.length,
      colors: items.map((item) => {
        const hex = item.hexBaseColor;
        return {
          id: item._id,
          name: item.name,
          baseColorName: item.baseColorName,
          hex, // additional
          colorStr: `${item.name}/${item.baseColorName}`,
        };
      }),
    });
  } catch (e) {
    const message = `Getting colors list error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const getColorById = async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) {
    return res.status(400)
      .json({
        message: `Color id ${id} is not valid`,
      });
  }

  try {
    const item = await Color.findById(id).lean();
    if (!item) {
      return res.status(400)
        .json({
          message: `Color with id ${id} is not found`,
        });
    }

    const hex = item.hexBaseColor;

    return res.status(200).json({
      id: item._id,
      name: item.name,
      baseColorName: item.baseColorName,
      hex, // additional
      colorStr: `${item.name}/${item.baseColorName}`,
    });
  } catch (e) {
    const message = `Getting color by id error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const updateColorById = async (req, res) => {
  const { id } = req.params;

  const data = {
    ...req.body,
    updatedDate: getFormattedCurrentUTCDate(),
  };

  try {
    const item = await Color
      .findByIdAndUpdate(
        id, // filter
        { $set: data }, // what we update
        { new: true, runValidators: true }, // options. returns new updated data
      )
      .lean();
    if (!item) {
      return res.status(200).json({
        message: `Color with id ${id} is not found`,
      });
    }

    return res.status(200).json(item);
  } catch (e) {
    const message = `Updating color by id error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const deleteColorById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Color.findByIdAndRemove(id).lean();
    if (!item) {
      return res.status(200).json({
        message: `Color with id ${id} is not found`,
      });
    }

    return res.status(200).json({
      message: `Color with id ${req.params.id} is deleted`,
    });
  } catch (e) {
    const message = `Deleting color by id error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const deleteAllColors = async (req, res) => {
  try {
    await Color.deleteMany({});
    return res.status(200).json({
      message: 'all Colors are deleted',
    });
  } catch (e) {
    const message = `Deleting all colors error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};
