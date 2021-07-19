import validator from 'validator';
import Subscriber from '../models/schemas/Subscriber';
import { log, getFormattedCurrentUTCDate } from '../helpers/helper';

export const subscribe = async (req, res) => {
  const { email } = req.body;

  if (!email || (email && !validator.isEmail(email))) {
    return res.status(400).json({
      message: 'incorrect email to subscribe',
    });
  }

  const data = {
    email,
    enabled: true,
    createdDate: getFormattedCurrentUTCDate(),
  };

  try {
    const subscriber = await Subscriber.findOneAndUpdate(
      { email },
      { $set: { enabled: true } },
      { new: true, runValidators: true },
    );
    if (!subscriber) {
      const updatedSubscriber = await new Subscriber(data).save();

      return res.status(200).json({
        message: 'success',
        subscriber: updatedSubscriber,
      });
    }

    return res.status(200).json({
      message: 'You are  already subscribed successfully',
      subscriber: { enabled: subscriber.enabled },
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `subscribe: error happened on server - "${error.message}" `,
    });
  }
};

export const unsubscribe = async (req, res) => {
  const { email } = req.body;

  if (!email || (email && !validator.isEmail(email))) {
    return res.status(400).json({
      message: 'incorrect email to unsubscribe',
    });
  }

  try {
    const subscriber = await Subscriber.findOneAndUpdate(
      { email },
      { $set: { enabled: false } },
      { new: true, runValidators: true },
    );
    if (!subscriber) {
      return res.status(200).json({
        message: `Email ${email} is not found in subscribers list`,
      });
    }

    return res.status(200).send({
      message: 'You are unsubscribed successfully',
      subscriber: { enabled: subscriber.enabled },
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `unsubscribe - Error happened on server: "${error.message}" `,
    });
  }
};

export const deleteAllSubscribers = async (req, res) => {
  try {
    await Subscriber.deleteMany({});
    return res.status(200).json({
      message: 'all Subscribers are deleted',
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete Subscribers error "${error.message}" `,
    });
  }
};

export const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find({}).lean();
    return res.status(200).json({
      subscribers,
      totalCount: subscribers.length,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Getting subscribers error: ${error.message}`,
    });
  }
};
