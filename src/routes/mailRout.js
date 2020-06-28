import express from 'express';
import {sendEmail} from '../config/mailgun';

const router = express.Router();

router.post('/', (req, res, next) => {
    const {subject, text, to, from} = req.body;
    sendEmail(subject, text, to, from, (error, message) => {
        if (error) {
            next(error);
            res.status(400)
                .json({message: error.message});
        } else {
            res.status(200)
                .json({message});
            next();
        }
    });
});

export default router;