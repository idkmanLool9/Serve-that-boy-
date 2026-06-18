import { Router } from 'express';
import { updatePushToken } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.put('/push-token', requireAuth, updatePushToken);

export default router;
