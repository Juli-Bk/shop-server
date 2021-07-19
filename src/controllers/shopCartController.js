import ShopCart from '../models/schemas/ShopCart';
import { log, getFormattedCurrentUTCDate } from '../helpers/helper';
import { validateObjectId } from '../helpers/filterParamsHelper';

export const createShopCart = async (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products)) {
    return res.status(400).json({
      message: 'Products must be an Array of products',
    });
  }

  if (!products.length) {
    return res.status(400).json({
      message: 'Products list must be specified for shop cart',
    });
  }

  try {
    const shopCartData = {
      ...req.body,
      createdDate: getFormattedCurrentUTCDate(),
    };

    const cart = await new ShopCart(shopCartData).save();
    return res.status(200).json({
      message: 'Success. Products are added to shop cart',
      cart,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Shop cart adding error: ${error.message}`,
    });
  }
};

export const getAllUShopCarts = async (req, res) => {
  try {
    const items = await ShopCart.find().lean();
    return res.status(200).json({
      carts: items,
      count: items.length,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Getting shop carts data error: ${error}`,
    });
  }
};

export const getUserShopCart = async (req, res) => {
  const userId = req.params.id;
  if (!userId || !validateObjectId(userId)) {
    return res.status(400).json({
      message: 'User id must be specified to get shop cart',
    });
  }

  try {
    const shopCart = await ShopCart.findOne({ userId }).lean();
    if (!shopCart) {
      return res.status(200).json({
        message: `Shop cart for user with id ${userId} is not found`,
      });
    }

    return res.status(200).json(shopCart);
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Error happened on server: "${error.message}" `,
    });
  }
};

export const updateShopCartById = async (req, res) => {
  const shopCartId = req.params.id;

  const shopCart = { ...req.body };

  shopCart.updatedDate = getFormattedCurrentUTCDate();
  if (!Array.isArray(shopCart.products)) {
    return res.status(400).json({
      message: 'Products must be an Array of products',
    });
  }

  let hasProperStructure = true;

  shopCart.products.forEach((el) => {
    if (!el.productId || !el.colorId || !el.sizeId || !el.cartQuantity) {
      hasProperStructure = false;
    }
  });

  if (!hasProperStructure) {
    return res.status(400).json({
      message: 'Every product in shop cart should have required properties: '
          + 'productId, colorId, sizeId, cartQuantity',
    });
  }

  try {
    const cart = await ShopCart.findOne({ _id: shopCartId });

    if (!cart) {
      return res.status(400)
        .json({ message: `Shop cart with id "${shopCartId}" is not found.` });
    }

    const updatedCart = await ShopCart.findOneAndUpdate(
      { _id: shopCartId },
      { $set: shopCart },
      { new: true, runValidators: true },
    );
    return res.status(200).json(updatedCart);
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `update shop cart - Error happened on server: "${error.message}" `,
    });
  }
};

export const deleteShopCartById = async (req, res) => {
  const { id } = req.params;
  try {
    const shopCart = await ShopCart.findByIdAndRemove(id).lean();
    if (!shopCart) {
      return res.status(200).json({
        message: `shop cart with id ${id} is not found`,
      });
    }

    return res.status(200).json({
      message: `Shop cart with id ${id} is deleted`,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete shop cart error: ${error.message}`,
    });
  }
};

export const deleteAllShopCarts = async (req, res) => {
  try {
    await ShopCart.deleteMany({}).lean();
    return res.status(200).json({
      message: 'all shop cart data are deleted',
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete shop carts error ${error.message}`,
    });
  }
};
