import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js";

const getProjects = asyncHandler(async (req, res) => {
  // get all projects
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Login is required',
        success: false
      })
    }
    const projects = await Project.find({ createdBy: req.user._id });
    return res.status(200).json({
      message: 'all good, here is your projects',
      projects,
      success: true
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const getProjectById = asyncHandler(async (req, res) => {
  if(!req?.user?._id){
    return res.status(400).json({
      message: 'Login is required',
      success: false
    })
  }
  // get project by id
  const { name } = req.params;
  if(!name){
    return res.status(400).json({
      message: 'project Id is required',
      success: false
    })
  }
  try {
    const userId = req.user._id;
    // Step 1: Find the project and make sure it belongs to the current user
    const project = await Project.findOne({ name, createdBy: userId });

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied." });
    }

    // Step 2: Delete the project
    // await Project.deleteOne({ name });

    return res.status(200).json({ 
      message: "Project found",
      project,
      success: true 
    });

  } catch (err) {
    return res.status(400).json({ message: "Invalid project ID", error: err.message });
  }  
});

const createProject = asyncHandler(async (req, res) => {
  // create project
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Loggedin Required',
        success: false
      })
    }
    const {name, description} = req.body;
    if(!name || !description){
      return res.status(400).json({
        message: 'All fields are Required',
        success: false
      })
    }
    const project = await Project.findOne({ name, createdBy: req.user._id });
    if(project){
      return res.status(400).json({
        message: 'Project already exists',
        success: false
      })
    }
    const newProject = await Project.create({
      name, description, 
      createdBy: req.user._id,
      members: req.user._id
    });
    await ProjectMember.create({
      user: req.user._id, 
      project: newProject._id,
      role: 'admin',
      members: req.user._id
    })
    return res.status(201).json({
      message: 'Project Created Successfully',
      newProject,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const updateProject = asyncHandler(async (req, res) => {
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Login is required',
        success: false
      })
    }
    // update project
    const {name, description, newName} = req.body;
    if(!name){
      return res.status(400).json({
        message: 'all fields are required',
        success: false
      })
    }
    const project = await Project.findOne({name, createdBy: req.user._id});
    if(!project){
      return res.status(400).json({
        message: 'Invalid Project or access denied',
        success: false
      })
    }
    if(description){
      project.description = description;
    }
    if(newName){
      project.name = newName;
    }
    await project.save();
    return res.status(200).json({
      message: 'project Updated',
      project,
      success: true
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const deleteProject = asyncHandler(async (req, res) => {
  if(!req?.user?._id){
    return res.status(400).json({
      message: 'Login is required',
      success: false
    })
  }
  // delete project
  try {
    const { name } = req.params;
    const userId = req.user._id;
    if(!name){
      return res.status(400).json({
        message: 'Invalid project ID',
        success: false
      })
    }

    // Step 1: Find the project and make sure it belongs to the current user
    const project = await Project.findOne({ name, createdBy: userId });

    if (!project) {
      return res.status(404).json({ 
        message: "Project not found or access denied.",
        success: false
      });
    }

    // Step 2: Delete the project
    await Project.deleteOne({ name });

    return res.status(200).json({ 
      message: "Project deleted successfully.",
      success: true
    });

  } catch (err) {
    return res.status(400).json({ message: "Invalid project ID", error: err.message });
  }
});

const getProjectMembers = asyncHandler(async (req, res) => {
  // get project members
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Loggin Required',
        success: false
      })
    }
    const name = req.params['name'];
    if(!name){
      return res.status(400).json({
        message: 'Project id is required',
        success: false
      })
    }
    const userProject = await Project.findOne({ name, createdBy: req.user._id });
    if(!userProject){
      return res.status(400).json({
        message: 'Invalid Project or access denied',
        success: false
      })
    }
    const projectMembers = await ProjectMember.find({ project: userProject._id })
      .select('user') // Select only 'user' field from ProjectMember
      .populate({
        path: 'user',
        select: '-password -refreshToken' // Exclude sensitive fields from populated user
      });

    if(!projectMembers){
      return res.status(400).json({
        message: 'no member exist or invalid project',
        success: false
      })
    }
    // console.log()
    return res.status(200).json({
      message: 'successfully get members',
      projectMembers,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const addMemberToProject = asyncHandler(async (req, res) => {
  // add member to project
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Loggin Required',
        success: false
      })
    }
    const {email, name, role} = req.body;
    if(!email || !name){
      return res.status(400).json({
        message: 'all fields are required',
        success: false
      })
    }
    const validProject = await Project.findOne({name, createdBy: req.user._id});
    if(!validProject){
      return res.status(400).json({
        message: 'Invalid project or access denied',
        success: false
      })
    }
    const isAdmin = await ProjectMember.findOne({ 
      user: req.user._id,
      project: validProject._id,
      role: 'admin'
    })
    if(!isAdmin){
      return res.status(401).json({
        message: 'Invalid request or access denied',
        success: false
      })
    }
    const isValidEmail = await User.findOne({ email });
    if(!isValidEmail){
      return res.status(401).json({
        message: 'Member is not registered',
        success: false
      })
    }
    const isadded = await ProjectMember.findOne({ user: isValidEmail._id });
    if(isadded){
      return res.status(400).json({
        message: 'Member already added',
        success: false
      })
    }
    const newMember = await ProjectMember.create({ 
      user: isValidEmail._id, 
      project: validProject._id,
      role: role || 'member'
    });
    return res.status(200).json({
      message: 'Member successfully added',
      newMember,
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const deleteMember = asyncHandler(async (req, res) => {
  // delete member from project
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Loggin Required',
        success: false
      })
    }
    const {name, email} = req.body;
    if(!name || !email){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    const validProject = await Project.findOne({name, createdBy: req.user._id});
    if(!validProject){
      return res.status(400).json({
        message: 'Invalid project or access denied',
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
        message: 'access denied',
        success: false
      })
    }
    const isValidEmail = await User.findOne({ email });
    if(!isValidEmail){
      return res.status(400).json({
        message: 'Invalid email',
        success: false
      })
    }
    const isMember = await ProjectMember.findOne({ 
      user: isValidEmail._id,
      project: validProject._id,
      role: 'member'
    })
    if(!isMember){
      return res.status(400).json({
        message: 'Invalid member',
        success: false
      })
    }
    const deletedMember = await ProjectMember.findOneAndDelete({
      user: isValidEmail._id,
      project: validProject._id,
      role: 'member'
    });
    return res.status(200).json({
      message: 'Member removed Successfully',
      deletedMember,
      success: true
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

const updateMemberRole = asyncHandler(async (req, res) => {
  // update member role
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'Loggin Required',
        success: false
      })
    }
    const {name, email, role} = req.body;
    if(!name || !email || !role){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    if(req.user.email == email){
      return res.status(400).json({
        message: 'self role change not allowed',
        success: false
      })
    }
    const isValidEmail = await User.findOne({ email });
    if(!isValidEmail){
      return res.status(400).json({
        message: 'Invalid email',
        success: false
      })
    }
    const isValidProject = await Project.findOne({ name, createdBy: req.user._id});
    if(!isValidProject){
      return res.status(400).json({
        message: 'Invalid Project',
        success: false
      })
    }
    const isAdmin = await ProjectMember.findOne({ 
      user: req.user._id,
      project: isValidProject._id,
      role: 'admin'
    })
    if(!isAdmin){
      return res.status(400).json({
        message: 'Access denied, not admin',
        success: false
      })
    }
    const isMemberInProject = await ProjectMember.findOne({
      user: isValidEmail._id,
      project: isValidProject._id
    });
    if(!isMemberInProject){
      return res.status(400).json({
        message: 'Access denied, Member not associated in this Project',
        success: false
      })
    }
    isMemberInProject.role = role;
    await isMemberInProject.save();
    return res.status(200).json({
      message: 'Role Updated',
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
});

export {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
};
