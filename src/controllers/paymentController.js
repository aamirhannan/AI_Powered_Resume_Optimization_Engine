import crypto from 'crypto';
import razorpayInstance from '../config/razorpay.js';
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/paymentDatabaseController.js';
import { camelToSnake, snakeToCamel } from './utils.js';

const ONE_MONTH_PLAN_AMOUNT = 49900; // Amount in smallest currency unit (e.g., 499.00 INR)

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const supabase = getAuthenticatedClient(req.accessToken);

        const options = {
            amount: ONE_MONTH_PLAN_AMOUNT,
            currency: "INR",
            receipt: `receipt_${Date.now().toString().slice(-8)}`,
            payment_capture: 1
        };

        const order = await razorpayInstance.orders.create(options);

        if (!order) {
            throw new Error('Some error occured while creating Razorpay order');
        }

        // Save initial record to DB (user_purchases only)
        const paymentRecord = {
            user_id: userId,
            razorpay_order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: 'created',
            created_at: new Date().toISOString()
        };

        await dbController.createPaymentRecord(supabase, paymentRecord);

        res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user.id;
        const supabase = getAuthenticatedClient(req.accessToken);

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, error: "Missing payment details" });
        }

        // 1. Fetch order to get status
        let paymentRecord;
        try {
            paymentRecord = await dbController.getPaymentByOrderId(supabase, razorpay_order_id);
        } catch (e) {
            return res.status(404).json({ success: false, error: "Order not found" });
        }

        // Idempotency Check
        if (paymentRecord.status === 'SUCCESS') {
            return res.status(200).json({ success: true, message: "Payment already verified" });
        }

        // 2. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // PAYMENT SUCCESS

            // 3. Calculate Validity (Stacking Logic)
            // Get the current latest expiry from the DB
            const currentLatestExpiry = await dbController.getLatestUserExpiry(supabase, userId);

            let newValidUntil = new Date();

            // If they have an active plan in the future, add 30 days to THAT date.
            // If they are expired or new, add 30 days to NOW.
            if (currentLatestExpiry && new Date(currentLatestExpiry) > new Date()) {
                newValidUntil = new Date(currentLatestExpiry);
            }

            // Add 30 Days
            newValidUntil.setDate(newValidUntil.getDate() + 30);

            // 4. Update Payment Status & Validity in user_purchases
            await dbController.updatePaymentStatus(supabase, razorpay_order_id, {
                status: 'success',
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature,
                updated_at: new Date().toISOString()
            }, newValidUntil.toISOString());

            res.status(200).json({ success: true, message: "Subscription activated" });

        } else {
            // PAYMENT FAILED
            await dbController.updatePaymentStatus(supabase, razorpay_order_id, {
                status: 'failed',
                updated_at: new Date().toISOString()
            });

            res.status(400).json({ success: false, error: "Invalid signature" });
        }

    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
