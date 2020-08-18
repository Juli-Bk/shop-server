import Subscriber from '../models/schemas/Subscriber';
import {log} from '../utils/helper';
import moment from "moment";

export const subscribe = (req, res, next) => {
    const {email} = req.body;

    if (!email) {
        res.status(400)
            .json({message: 'Email is required to subscribe to newsletters'});
        return;
    }
    const data = {
        email,
        enabled: true,
        createdDate: moment.utc().format("MM-DD-YYYY")
    };

    Subscriber
        .findOneAndUpdate(
            {email: email},
            {$set: {enabled: true}},
            {new: true, runValidators: true})
        .then(subscriber => {
            if (!subscriber) {
                const newItem = new Subscriber(data);

                newItem
                    .save()
                    .then(subscriber => res
                        .status(200)
                        .json({
                            message: 'success',
                            subscriber
                        })
                    )
                    .catch(error => {
                        res.status(400)
                            .json({
                                message: `New subscriber adding error: ${error}`
                            });
                        next(error);
                    });

            } else {
                return res.status(200)
                    .send({
                        message: 'You are subscribed successfully',
                        subscriber: {enabled: subscriber.enabled}
                    })
            }
        })
        .catch(error => {
            res.status(400)
                .json({
                    message: `unsubscribe - Error happened on server: "${error.message}" `
                });
            log(error);
            next(error);
        });
};

export const unsubscribe = (req, res, next) => {
    const {email} = req.body;

    if (!email) {
        res.status(400)
            .json({message: 'Email is required to unsubscribe'});
        return;
    }

    Subscriber
        .findOneAndUpdate(
            {email: email},
            {$set: {enabled: false}},
            {new: true, runValidators: true})
        .then(subscriber => {
            if (!subscriber) {
                return res.status(200)
                    .json({
                        message: `Email ${email} is not found in subscribers list`
                    })
            } else {
                return res.status(200)
                    .send({
                        message: 'You are unsubscribed successfully',
                        subscriber: {enabled: subscriber.enabled}
                    })
            }
        })
        .catch(error => {
            res.status(400)
                .json({
                    message: `unsubscribe - Error happened on server: "${error.message}" `
                });
            log(error);
            next(error);
        });
}

export const deleteAllSubscribers = (req, res, next) => {
    Subscriber.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all Subscribers are deleted'
            })
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete Subscribers error "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const getAllSubscribers = (req, res, next) => {
    Subscriber
        .find({})
        .lean()
        .then(subscribers => {
            res.status(200).json({
                subscribers,
                totalCount: subscribers.length
            });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting subscribers error: ${error.message}`
                    });
                log(error);
                next(error);
            }
        );
};
