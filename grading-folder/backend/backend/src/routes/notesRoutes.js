import express from "express";
import  {getAllNotes}  from "../controllers/notesControllers.js";
import { createNote } from "../controllers/notesControllers.js";
import { deleteNote } from "../controllers/notesControllers.js";
import { updateNote } from "../controllers/notesControllers.js";
const router = express.Router();

router.post("/",createNote);
router.get("/", getAllNotes);

router.put("/:id", updateNote);

router.delete("/:id", deleteNote);


export default router;
