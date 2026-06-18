import { Router } from 'express';
import { getMyFamily } from '../controllers/family.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, getMyFamily);

export default router;
