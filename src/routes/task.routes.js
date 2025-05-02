import { Router } from "express";
import isLoggedIn from "../middlewares/isLoggedIn.middleware.js";
import { createSubTask, createTask, deleteSubTask, deleteTask, getTaskById, getTasks, updateSubTask, updateTask } from "../controllers/task.controllers.js";

const router = Router()

router.get('/alltasks', isLoggedIn, getTasks);
router.get('/:taskId', isLoggedIn, getTaskById);
router.post('/createtask', isLoggedIn, createTask);
router.post('/updatetask', isLoggedIn, updateTask);
router.post('/deletetask', isLoggedIn, deleteTask);
router.post('/createsubtask', isLoggedIn, createSubTask);
router.post('/updatesubtask', isLoggedIn, updateSubTask);
router.post('/deletesubtask', isLoggedIn, deleteSubTask);


export default router