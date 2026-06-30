import { Router } from 'express';
import { handleGetProjects, handleUpdateProject, handleDeleteProject } from '../../controllers/project.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', handleGetProjects);
router.put('/:id', handleUpdateProject);
router.delete('/:id', handleDeleteProject);

export default router;
