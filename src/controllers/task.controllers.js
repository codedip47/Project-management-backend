import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { SubTask } from "../models/subtask.models.js";
import { Task } from "../models/task.models.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js";

// get all tasks
const getTasks = asyncHandler(async (req, res) => {
  // get all tasks
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Login Is Required',
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
      members: req.user._id
    })
    if(!validProject){
      return res.status(400).json({
        message: 'Invalid Project or Access denied',
        success: false
      })
    }
    const allTasks = await Task.find({
      project: validProject._id
    })
    return res.status(200).json({
      message: 'tasks fetched successfully',
      allTasks,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

// get task by id
const getTaskById = asyncHandler(async (req, res) => {
  // get task by id
  try {
    if(!req.user._id){
      return res.status(400).json({
        message: 'Login is Required',
        success: false
      })
    }
    const { taskId } = req.params;
    if(!taskId){
      return res.status(400).json({
        message: 'Project Id is required',
        success: false
      })
    }
    const validTask = await Task.findOne({
      title: taskId,
      $or: [
        {assignedBy: req.user._id},
        {assignedTo: req.user._id}
      ]
    })
    if(!validTask){
      return res.status(400).json({
        message: 'Invalid Task or Access denied',
        success: false
      })
    }
    return res.status(200).json({
      message: 'task fetched',
      validTask,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

// create task
const createTask = asyncHandler(async (req, res) => {
  // create task
  try {
    if(!req.user._id){
      return res.status(400).json({
        message: 'Login is required',
        success: false
      })
    }
    const { projectName, title, description, assignedTo, assignedBy } = req.body;
    if(!projectName || !title || !description || !assignedTo || !assignedBy){
      return res.status(400).json({
        message: 'all fields are required',
        success: false
      })
    }
    const isValidEmailAssigner = await User.findOne({
      email: assignedBy
    })
    if(!isValidEmailAssigner){
      return res.status(400).json({
        message: 'Invalid Email Assigner',
        success: false
      })
    }
    const validProject = await Project.findOne({
      name: projectName,
      members: isValidEmailAssigner._id
    })
    if(!validProject){
      return res.status(400).json({
        message: 'Invalid Project',
        success: false
      })
    }
    const isAdmin = await ProjectMember.findOne({
      user: req.user._id,
      project: validProject._id,
      role: 'admin'
    });
    if(!isAdmin){
      return res.status(400).json({
        message: 'Access denied',
        success: false
      })
    }
    const isValidEmailAssignment = await User.findOne({
      email: assignedTo
    })
    if(!isValidEmailAssignment){
      return res.status(400).json({
        message: 'Invalid Email Assignment',
        success: false
      })
    }
    const alreadyAssigned = await Task.findOne({
      project: validProject._id,
      assignedTo: isValidEmailAssignment._id
    })
    if(alreadyAssigned){
      return res.status(400).json({
        message: 'Already Assigned',
        success: false
      })
    }
    const newTask = await Task.create({
      title: title,
      description: description,
      project: validProject._id,
      assignedTo: isValidEmailAssignment._id,
      assignedBy: isValidEmailAssigner._id,
    })
    if(!newTask){
      return res.status(400).json({
        message: 'task creation failed',
        success: false
      })
    }
    return res.status(201).json({
      message: 'Task created',
      newTask,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

// update task
const updateTask = asyncHandler(async (req, res) => {
  // update task
  try {
    if(!req.user._id){
      return res.status(400).json({
        message: 'Login Required',
        success: false
      })
    }
    const { title, description, assignedTo, assignedBy, status, newTitle } = req.body;
    if(!title){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    const validUser = await Task.findOne({
      title: title,
      assignedBy: req.user._id
    });
    if(!validUser){
      return res.status(400).json({
        message: 'Invalid Request',
        success: false
      })
    }
    if(description){
      validUser.description = description;
    }
    if(assignedTo){
      validUser.assignedTo = assignedTo;
    }
    if(assignedBy){
      validUser.assignedBy = assignedBy;
    }
    if(status){
      validUser.status = status;
    }
    if(newTitle){
      validUser.title = newTitle;
    }
    validUser.save({validateBeforeSave:false});
    return res.status(200).json({
      message: 'Task Updated',
      validUser,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

// delete task
const deleteTask = asyncHandler(async (req, res) => {
  // delete task
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Login required',
        success: false
      })
    }
    const { title } =  req.body;
    if(!title){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    const validTask = await Task.findOne({
      title: title,
      assignedBy: req.user._id
    })
    if(!validTask){
      return res.status(400).json({
        message: 'Invalid Task or Access denied',
        success: false
      })
    }
    const deleteTask = await Task.findOneAndDelete({
      title: title,
      assignedBy: req.user._id,
    })
    return res.status(200).json({
      message: 'Task deleted',
      deleteTask,
      success: false
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

// create subtask
const createSubTask = asyncHandler(async (req, res) => {
  // create subtask
  try {
    if(!req.user._id){
      return res.status(400).json({
        message: 'login required',
        success: false
      })
    }
    const { subTaskTitle, taskTitle } = req.body;
    if(!subTaskTitle || !taskTitle){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    const validTask = await Task.findOne({
      title: taskTitle,
      assignedBy: req.user._id
    })
    if(!validTask){
      return res.status(400).json({
        message: 'Invalid Task',
        success: false
      })
    }
    const newSubTask = await SubTask.create({
      title: subTaskTitle,
      task: validTask._id,
      createdBy: req.user._id
    })
    if(!newSubTask){
      return res.status(400).json({
        message: 'Subtask creation Failed, try again',
        success: false
      })
    }
    return res.status(201).json({
      message: 'subtask created',
      newSubTask,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

// update subtask
const updateSubTask = asyncHandler(async (req, res) => {
  // update subtask
  try {
    if(!req.user._id){
      return res.status(400).json({
        message: 'login required',
        success: false
      })
    }
    const { title, status, createdBy, newTitle } = req.body;
    if(!title){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    const validTask = await SubTask.findOne({
      title,
      createdBy: req.user._id
    })
    if(!validTask){
      return res.status(400).json({
        message: 'Invalid task or access denied',
        success: false 
      })
    }
    if(createdBy){
      const isValidUser = await User.findOne({
        email: createdBy
      })
      if(!isValidUser){
        return res.status(400).json({
          message: 'Invalid User Email',
          success: false
        })
      }
      validTask.createdBy = createdBy;
    }
    if(status){
      validTask.isCompleted = status;
    }
    if(newTitle){
      validTask.title = newTitle;
    }
    await validTask.save({validateBeforeSave: false});
    return res.status(200).json({
      message: 'subtask updated',
      validTask,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

// delete subtask
const deleteSubTask = asyncHandler(async (req, res) => {
  // delete subtask
  try {
    if(!req.user._id){
      return res.status(400).json({
        message: 'login required',
        success: false
      })
    }
    const { title } = req.body;
    if(!title){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    const validTask = await SubTask.findOne({
      title,
      createdBy: req.user._id
    })
    if(!validTask){
      return res.status(400).json({
        message: 'Invalid subtask or access denied',
        success: false
      })
    }
    const deletedSubTask = await SubTask.findOneAndDelete({
      title,
      createdBy: req.user._id
    })
    if(!deletedSubTask){
      return res.status(400).json({
        message: 'failed to delete sub task',
        success: false
      })
    }
    return res.status(200).json({
      message: 'Sub task deleted',
      deletedSubTask,
      success: true
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

export {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
};
