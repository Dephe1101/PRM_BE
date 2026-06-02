import { Router } from 'express';
import authRoute from './authRoute';
import levelRoute from './levelRoute';
import topicRoute from './topicRoute';
import wordRoute from './wordRoute';
import flashcardRoute from './flashcardRoute';
import gameRoute from './gameRoute';
import mediaRoute from './mediaRoute';
import adminRoute from './adminRoute';

const router = Router();

router.use('/auth', authRoute);
router.use('/levels', levelRoute);
router.use('/topics', topicRoute);
router.use('/words', wordRoute);
router.use('/flashcards', flashcardRoute);
router.use('/games', gameRoute);
router.use('/media', mediaRoute);
router.use('/admin', adminRoute);

router.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

export default router;
