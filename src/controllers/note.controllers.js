// boilderplate code
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import { asyncHandler } from "../utils/async-handler.js";

const getNotes = asyncHandler(async (req, res) => {
  // get all notes
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Login Required',
        success: false
      })
    }
    const allNotes = await ProjectNote.find({ createdBy: req.user._id });
    return res.status(200).json({
      message: 'Note fetched Successfull',
      allNotes,
      success: true
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const getNoteById = asyncHandler(async (req, res) => {
  // get note by id
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Login Required',
        success: false
      })
    }
    const { projectName } = req.params;
    const validProject = await Project.findOne({ 
      name: projectName,
      createdBy: req.user._id
    });
    console.log(validProject);
    if(!validProject){
      return res.status(400).json({
        message: 'Invalid Project',
        success: false
      })
    }
    const validNote = await ProjectNote.find({ 
      project: validProject._id,
      createdBy: req.user._id
    })
    if(!validNote){
      return res.status(400).json({
        message: 'Invalid Note',
        success: false
      })
    }
    return res.status(200).json({
      message: 'note fetched successfully',
      validNote,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const createNote = asyncHandler(async (req, res) => {
  // create note
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Login Required',
        success: false
      })
    }
    const { project, content } = req.body;
    
    if(!project || !content){
      return res.status(400).json({
        message: 'all fields are required',
        success: false
      })
    }
    const validProject = await Project.findOne({
      name: project,
      createdBy: req.user._id
    });
    if(!validProject){
      return res.status(400).json({
        message: 'Invalid Project or Access denied',
        success: false
      })
    }
    const note = await ProjectNote.findOne({ 
      project: validProject._id,
      createdBy: req.user._id
    });
    if(note){
      return res.status(400).json({
        message: 'Note allready Exists',
        success: false
      })
    }
    const newNote = await ProjectNote.create({
      project: validProject._id,
      createdBy: req.user._id,
      content: content
    })
    return res.status(201).json({
      message: 'Note Created Successfully',
      newNote,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const updateNote = asyncHandler(async (req, res) => {
  // update note
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Login Required',
        success: false
      })
    }
    const { projectName, content } = req.body;
    if(!projectName || !content){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    const validProject = await Project.findOne({
      name: projectName,
      createdBy: req.user._id
    })
    if(!validProject){
      return res.status(400).json({
        message: 'Invalid Project or Access denied',
        success: false
      })
    }
    const note = await ProjectNote.findOne({
      project: validProject._id,
      createdBy: req.user._id
    })
    note.content = content;
    await note.save();
    return res.status(200).json({
      message: 'note updated successfully',
      note,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const deleteNote = asyncHandler(async (req, res) => {
  // delete note
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Login Required',
        success: false
      })
    }
    const { projectName } = req.body;
    if(!projectName){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    const validProject = await Project.findOne({
      name: projectName,
      createdBy: req.user._id
    })
    if(!validProject){
      return res.status(400).json({
        message: 'Invalid Project or Access denied',
        success: false
      })
    }
    const note = await ProjectNote.findOneAndDelete({
      project: validProject._id,
      createdBy: req.user._id
    })
    return res.status(200).json({
      message: 'note deleted successfully',
      note,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
