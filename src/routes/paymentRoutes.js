
import express from 'express';
import { createOrder, verifyPayment, getPurchaseHistory } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/history', getPurchaseHistory);



export default router;
