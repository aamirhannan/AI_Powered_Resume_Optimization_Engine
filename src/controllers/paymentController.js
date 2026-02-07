import crypto from 'crypto';
import razorpayInstance from '../config/razorpay.js';
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/paymentDatabaseController.js';
import { countEmailsInTimeFrame } from '../DatabaseController/emailAutomationDatabaseController.js';
import { countGeneratedResumesInTimeFrame } from '../DatabaseController/generatedResumeDatabaseController.js';
import { camelToSnake, snakeToCamel } from './utils.js';
import { PLAN_PRICES, PLANS } from '../utils/utilFunctions.js';

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const supabase = getAuthenticatedClient(req.accessToken);
        const { planType } = req.body;

        if (!planType || !PLANS[planType]) {
            return res.status(400).json({ success: false, error: "Invalid plan type. Must be PRO_TIER or PREMIUM_TIER" });
        }

        const amount = PLAN_PRICES[planType];

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `receipt_${Date.now().toString().slice(-8)}`,
            payment_capture: 1,
            notes: {
                payment_type: planType // Pass plan info to notes for reference
            }
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
            created_at: new Date().toISOString(),
            plan_tier: planType // Pass the selected plan type to DB controller
        };

        await dbController.createPaymentRecord(supabase, paymentRecord);

        res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            product_name: planType === 'PRO_TIER' ? 'Pro Plan' : 'Premium Plan',
            description: '1 Month Subscription'
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

export const getPurchaseHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const supabase = getAuthenticatedClient(req.accessToken);

        // 1. Get Purchase History
        const history = await dbController.getUserPurchases(supabase, userId);

        // 2. Determine Current Plan
        const activeSub = await dbController.getActiveSubscription(supabase, userId);

        // 3. Determine Usage Window Start Time
        let startTime = new Date();
        const planTier = activeSub ? (activeSub.plan_tier || PLANS.PRO_TIER) : PLANS.TRIAL_TIER;

        if (planTier === PLANS.TRIAL_TIER) {
            // Rolling 30 Days window
            startTime.setDate(startTime.getDate() - 30);
        } else {
            // Rigid Day Window: Resets at 00:00 UTC today for PRO/PREMIUM
            startTime.setUTCHours(0, 0, 0, 0);
        }

        // 4. Get User Usage Counts
        const emailSentCount = await countEmailsInTimeFrame(supabase, userId, startTime);
        const resumeGeneratedCount = await countGeneratedResumesInTimeFrame(supabase, userId, startTime);

        let currentPlan = {
            tier: PLANS.TRIAL_TIER, // Default to TRIAL_TIER instead of 'Free'
            expiresAt: null,
            isActive: false,
            emailSent: emailSentCount,
            resumeGenerated: resumeGeneratedCount
        };

        if (activeSub) {
            currentPlan = {
                tier: activeSub.plan_tier || PLANS.PRO_TIER, // Fallback to PRO if undefined, though it should be there
                expiresAt: activeSub.valid_until,
                isActive: true,
                emailSent: emailSentCount,
                resumeGenerated: resumeGeneratedCount
            };
        }

        res.status(200).json({
            success: true,
            currentPlan,
            history
        });

    } catch (error) {
        console.error("Get Purchase History Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
