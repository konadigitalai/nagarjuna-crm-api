import { Router } from 'express';

import { appStatistics } from '../controllers/app-statistics.controller';

const router = Router();

router.get('/', appStatistics);

export default router;