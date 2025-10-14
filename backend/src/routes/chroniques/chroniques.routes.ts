import { Router } from 'express';
import { 
  getLatestStories, 
  getUserStory, 
  getUserStories 
} from '@controllers/chroniques/publicStoriesController';
import { getCount } from '@controllers/user/likeController';

const router = Router();

//======= PUBLIC ROUTES =======

router.get('/stories/latest', getLatestStories);
router.get('/stories/user/:userId', getUserStories);  
router.get('/stories/:id', getUserStory);              
router.get('/likes/story/:id/count', getCount);

export default router;