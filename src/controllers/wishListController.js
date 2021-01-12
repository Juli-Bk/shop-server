import WishList from '../models/schemas/WishList';
import { log } from '../helpers/helper';
import { validateObjectId } from '../helpers/filterParamsHelper';

const addToExistingWishlist = async (userWishes, productId, userId) => {
  const wishes = userWishes[0];
  const products = wishes.products.map((pr) => pr._id.toString());
  if (products.includes(productId)) {
    return 'The product is already in your wishList';
  }

  products.push(productId);

  await WishList.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        products,
      },
    },
    { new: true, runValidators: true },
  ).lean();

  return 'Success operation';
};

export const addProductToWishList = async (req, res) => {
  const { productId, userId } = req.body;
  if (!productId || !validateObjectId(productId)) {
    return res.status(400).json({
      message: 'add product to wish list error: productId parameter is required',
    });
  }

  if (!userId || !validateObjectId(userId)) {
    return res.status(400).json({
      message: 'add product to wish list error: userId parameter is required',
    });
  }

  try {
    const userWishes = await WishList.find({ userId }).lean();
    if (!userWishes.length) {
      const wishList = await new WishList({
        userId,
        products: [productId],
      }).save();

      return res.status(200).json({
        wishList,
        message: 'Success. New wish is created',
      });
    }

    const message = await addToExistingWishlist(userWishes, productId, userId);
    return res.status(200).json({ message });
  } catch (error) {
    log(error.message);
    return res.status(400).json({
      message: `add product to wish list error: "${error.message}"`,
    });
  }
};

export const getAllWishListData = async (req, res) => {
  try {
    const items = await WishList.find().lean();
    return res.status(200).json({ items });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Getting wishes error: ${error.message}`,
    });
  }
};

export const getUserWishes = async (req, res) => {
  const userId = req.params.id;

  try {
    const userWishList = await WishList.find({ userId }).lean();
    return res.status(200).json({ userWishList });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Getting user wishes error: ${error.message}`,
    });
  }
};

export const deleteProductFromWishlist = async (req, res) => {
  const productId = req.params.id;
  const userId = req.user.id;

  try {
    const userWishes = await WishList.find({ userId }).lean();
    if (!userWishes.length) {
      return res.status(400).json({
        message: 'user has an empty wishlist',
      });
    }

    if (!userWishes[0].products.length) {
      return res.status(400).json({
        message: `user has no product with id:${productId} in the wishList`,
      });
    }

    const wishes = userWishes[0];
    const products = wishes.products.map((pr) => pr._id.toString());
    if (!products.includes(productId)) {
      return res.status(400).json({
        message: `user ${userId} has no product ${productId} in the wishList`,
      });
    }

    const newProductList = wishes.products
      .filter((pr) => pr._id.toString() !== productId)
      .map((pr) => pr._id.toString());

    await WishList.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          products: newProductList,
        },
      },
    ).lean();

    return res.status(200).json({
      message: 'Success. Product is deleted from wishlist',
    });
  } catch (error) {
    log(error.message);
    return res.status(400).json({
      message: `delete wish error: "${error.message}" `,
    });
  }
};

export const deleteAllWishes = async (req, res) => {
  try {
    await WishList.deleteMany({});
    return res.status(200).json({ message: 'all WishList data are deleted' });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete WishList data error "${error.message}"`,
    });
  }
};
