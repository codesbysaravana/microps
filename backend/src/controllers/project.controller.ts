import { Request, Response } from 'express';
import { fetchAllProjectsOneUser, updateProjectDB, deleteProjectDB } from '../repository/project.repository';

export const handleGetProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const projects = await fetchAllProjectsOneUser(userId);
    if (!projects) {
      return res.status(200).json({ success: true, projects: [] });
    }

    const baseDomain = process.env.BASE_DOMAIN || 'microps.in';
    const enrichedProjects = projects.map((p: any) => ({
      ...p,
      liveUrl: p.live_url || `http://tenant-${userId}-${p.name}.${baseDomain}`,
    }));

    return res.status(200).json({ success: true, projects: enrichedProjects });
  } catch (error: any) {
    console.error('[PROJECTS] Error fetching projects:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const handleUpdateProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const projectId = parseInt(req.params.id);
    const { branch, buildCommand, installCommand } = req.body;

    if (!userId || isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const updated: any = await updateProjectDB(userId, projectId, branch || 'main', buildCommand || '', installCommand || '');
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Project not found or update failed' });
    }

    const baseDomain = process.env.BASE_DOMAIN || 'microps.in';
    const enrichedProject = {
      ...updated,
      liveUrl: updated.live_url || `http://tenant-${userId}-${updated.name}.${baseDomain}`,
    };

    return res.status(200).json({ success: true, project: enrichedProject });
  } catch (error: any) {
    console.error('[PROJECTS] Error updating project:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const handleDeleteProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const projectId = parseInt(req.params.id);

    if (!userId || isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const deleted = await deleteProjectDB(userId, projectId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Project not found or already deleted' });
    }

    return res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('[PROJECTS] Error deleting project:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
