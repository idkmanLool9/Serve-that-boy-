import { Router } from 'express';
import {
  acceptRequest,
  completeRequest,
  createRequest,
  listRequests,
  replyToRequest,
} from '../controllers/request.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', listRequests);

// Only Customers can create requests.
router.post('/', requireRole('CUSTOMER'), createRequest);

// Only Servers can act on requests.
router.post('/:id/accept', requireRole('SERVER'), acceptRequest);
router.post('/:id/complete', requireRole('SERVER'), completeRequest);
router.post('/:id/reply', requireRole('SERVER'), replyToRequest);

export default router;
