import { Router } from "express";
import isLoggedIn from "../middlewares/isLoggedIn.middleware.js";
import { createNote, deleteNote, getNoteById, getNotes, updateNote } from "../controllers/note.controllers.js";

const router = Router()

router.get('/allnotes', isLoggedIn, getNotes);
router.get('/id/:projectName', isLoggedIn, getNoteById);
router.post('/createnote', isLoggedIn, createNote);
router.post('/updatenote', isLoggedIn, updateNote);
router.post('/deletenote', isLoggedIn, deleteNote);

export default router