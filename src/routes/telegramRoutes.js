
import express from 'express';
import { getTelegramStartCode } from '../controllers/telegramController.js';

const router = express.Router();

router.get('/start-code', getTelegramStartCode);

export default router;
