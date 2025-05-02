import { Router } from "express";
import isLoggedIn from "../middlewares/isLoggedIn.middleware.js";
import { addMemberToProject, createProject, deleteMember, deleteProject, getProjectById, getProjectMembers, getProjects, updateMemberRole, updateProject } from "../controllers/project.controllers.js";

const router = Router();

router.post('/createproject', isLoggedIn, createProject);
router.get('/getprojects', isLoggedIn, getProjects);
router.get('/getprojects/:name', isLoggedIn, getProjectById);
router.post('/deleteprojects/:name', isLoggedIn, deleteProject);
router.post('/updateproject', isLoggedIn, updateProject);
router.get('/getprojectmember/:name', isLoggedIn, getProjectMembers);
router.post('/addmember', isLoggedIn, addMemberToProject);
router.post('/removemember', isLoggedIn, deleteMember);
router.post('/updatememberrole', isLoggedIn, updateMemberRole);

export default router;