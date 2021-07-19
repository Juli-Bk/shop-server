import Category from '../models/schemas/Category';
import { log, getFormattedCurrentUTCDate } from '../helpers/helper';

export const addCategory = async (req, res) => {
  const filePath = req.file ? req.file.path || req.file.location : null;

  const { categoryBreadcrumbs } = req.body;
  if (!categoryBreadcrumbs) {
    return res.status(400).json({ message: 'categoryBreadcrumbs is required' });
  }

  const data = {
    ...req.body,
    createdDate: getFormattedCurrentUTCDate(),
    imageUrl: filePath,
  };

  const parent = await Category
    .findOne({ categoryBreadcrumbs })
    .lean();

  if (parent) {
    data.level = parent.level + 1;
    data.parentId = parent._id;
  }

  try {
    const newItem = await new Category(data).save();
    return res.status(200).json({
      message: 'success',
      category: newItem,
    });
  } catch (e) {
    const message = `New category adding error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

const filterFields = (category) => ({
  id: category.id,
  name: category.name,
  level: category.level,
  categoryBreadcrumbs: category.categoryBreadcrumbs,
  children: category.children,
});

const getChildren = (id, items) => items.filter((item) => {
  const { parentId } = item;
  return parentId && (parentId._id.toString() === id);
});

const getHierarchyCategoryList = (allCategories) => {
  const roots = allCategories.filter((el) => el.level === 1);

  const searchChildren = (parentCategories) => parentCategories.map((parentCategory) => {
    const id = parentCategory._id.toString();

    // eslint-disable-next-line no-param-reassign
    parentCategory.children = getChildren(id, allCategories);
    if (parentCategory.children.length) {
      searchChildren(parentCategory.children);

      // eslint-disable-next-line no-param-reassign
      parentCategory.children = parentCategory.children.map((item) => filterFields(item));
    }

    return filterFields(parentCategory);
  });

  return searchChildren(roots);
};

export const getAllCategories = async (req, res) => {
  try {
    const items = await Category.find({});
    const maxNestingLevel = Math.max(...items.map((i) => i.level));

    return res.status(200).json({
      categories: getHierarchyCategoryList(items),
      plainList: items,
      categoriesTotalCount: items.length,
      maxNestingLevel,
    });
  } catch (e) {
    const message = `Getting categories error "${e.message}"`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const getCategoryById = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.status(400).json({
        message: `Category with id ${categoryId} is not found`,
      });
    }

    return res.status(200).json(category);
  } catch (e) {
    const message = `Error happened on server: "${e.message}"`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const updateCategoryById = async (req, res) => {
  const categoryId = req.params.id;
  const filePath = req.file ? req.file.location : null;

  const data = {
    ...req.body,
    updatedDate: getFormattedCurrentUTCDate(),
    imageUrl: filePath,
  };

  try {
    const category = await Category.findByIdAndUpdate(
      categoryId, // filter
      { $set: data }, // what we update
      { new: true, runValidators: true }, // options. returns new updated data
    ).lean();
    if (!category) {
      return res.status(200).json({
        message: `Category with id ${categoryId} is not found`,
      });
    }

    return res.status(200).json(category);
  } catch (e) {
    const message = `Error happened on server: "${e.message}"`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const deleteCategoryById = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const category = await Category.findByIdAndRemove(categoryId);
    if (!category) {
      return res.status(200).json({
        message: `Category with id ${categoryId} is not found`,
      });
    }

    return res.status(200).json({
      message: `Category with id ${req.params.id} is deleted`,
    });
  } catch (e) {
    const message = `Error happened on server: "${e.message}"`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const deleteAllCategories = async (req, res) => {
  try {
    await Category.deleteMany({});
    return res.status(200).json({
      message: 'all categories are deleted',
    });
  } catch (e) {
    const message = `delete categories error "${e.message}" `;
    log(message);
    return res.status(400).json({ message });
  }
};
