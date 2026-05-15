import { Router } from 'express';
import { authorize } from '../middlewares/authorize';

import { webStatistics, getContactsCountByTypeAndDate, getOverallEnrolment, getUserActivity, getOverallDistance } from '../controllers/web-statistics.controller';

const router = Router();

router.get('/report', authorize, webStatistics);
router.get('/new-enrollment', authorize, getContactsCountByTypeAndDate);
router.get('/over-all-enrollment', authorize, getOverallEnrolment);
router.get('/over-all-distance', authorize, getOverallDistance);
router.get('/my-employees', authorize, getUserActivity);

export default router;