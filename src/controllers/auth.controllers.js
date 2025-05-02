import { User } from '../models/user.models.js';
import { asyncHandler } from "../utils/async-handler.js";
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';
import verifyYourEmail from '../utils/mail.n.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const cookieOptions = {
  httpOnly: true, 
  secure: true
}

function deleteImageFile(localAvatarPath){
  console.log(localAvatarPath);
  try {
    fs.unlink(localAvatarPath, (err) => {
      if(err){
        throw err;
      }
      console.log('Deleted file at:', localAvatarPath);
    });
  } catch(err){
    throw new Error(err.message);
  }
}

const registerUser = asyncHandler(async (req, res) => {   
    let localAvatarPath = undefined;
    if(req?.file?.path) 
      localAvatarPath = req?.file?.path;
    // check req.body 
    if(!req.body)
    {
      if(localAvatarPath){
        deleteImageFile(localAvatarPath);
      }
      return res.status(400).json({
        message: "req is not valid",
      });
    }
    // destructure data from req.body
    const { email, password, username, role } = req.body;
    // Filled validations
    if(!email || !username || !password || !role ){
      if(localAvatarPath){
        deleteImageFile(localAvatarPath);
      }
      return res.status(400).json({
        message: "Required Fields are not available",
        success: false
      })
    }
  try{
    // check if user already registered
    const userExist = await User.findOne( {
      $or: [{email} , {username}]
    });

    // check if already exist
    if(userExist)
    {
        if(localAvatarPath)
          deleteImageFile(localAvatarPath);
        return res.status(400).json({
          message: "User already Registered, Please Login",
          success: false
        })
    }
    
    // upload Image in clodinary if given
    if(localAvatarPath)
    {
      avatar_url = await cloudinary(localAvatarPath);
    }
    let newUser = '';
    if(localAvatarPath)
    {
      newUser = await User.create({email, password, username, role, avatar: {
        url: localAvatarPath, localPath: ''
      }});
    }
    else
    {
      newUser = await User.create({email, password, username, role});
    }
    // send mail verification
    const { unHashedToken, hashedToken, tokenExpiry } = await newUser.generateTemporaryToken();
    newUser.emailVerificationToken = hashedToken;
    newUser.emailVerificationExpiry = tokenExpiry;
    await newUser.save();
    const emailRes = await verifyYourEmail(email, unHashedToken, 'email');

    if(!emailRes){
      return res.status(400).json({
        message: 'Failed to Send mail try again',
        success: false
      })
    }
    // delete the local image file
    if(localAvatarPath){
      deleteImageFile(localAvatarPath);
    }

    return res.status(200).json({
      message: 'User registered'
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if((!email && !username) || !password){
      return res.status(400).json({
        message: 'All fields are required',
        success: false
      })
    }
    const userExist = await User.findOne({ 
      $or: [{email}, {username}]
    });
    if(!userExist){
      return res.status(404).json({
        message: 'Invalid Credentials',
        success: false
      })
    }
    const isPasswordCorrect = await userExist.isPasswordCorrect(password);
    
    if(!isPasswordCorrect){
      return res.status(401).json({
        message: 'Invalid Credentials',
        success: false
      })
    }
    
    const refreshToken = userExist.generateRefreshToken();
    const accessToken = userExist.generateAccessToken();
    
    // save refresh token to DB
    userExist.refreshToken = refreshToken;
    await userExist.save({ validateBeforeSave: false });
    const user = await User.findById(userExist._id).select("-password -refreshToken");
  
    res.cookie('RefreshToken', refreshToken, cookieOptions);
    res.cookie('AccessToken', accessToken, cookieOptions);
  
    return res.status(200).json({
      message: 'Logged In Successfully',
      user: user,
      refreshToken,
      accessToken
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false
    })
  }
  
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    if(!req?.user?._id){
      return res.status(400).json({
        message: 'login required',
        success: false
      })
    }
    const user = await User.findById(req.user._id);
    if(!user){
      return res.status(400).json({
        message: 'Invalid user',
        success: false
      })
    }
    user.refreshToken = undefined;
    await user.save();
    res.clearCookie('RefreshToken', cookieOptions);
    res.clearCookie('AccessToken', cookieOptions);
    //validation
    return res.status(200).json({
      message: 'Logout Successfully',
      success: true
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
  }
});

const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const token = req.params['token'];
    if(!token){
      return res.status(400).json({
        message: 'Token is required',
        success: false
      })
    }
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    const user = await User.findOne({emailVerificationToken: hashedToken});
    if(!user){
      return res.status(400).json({
        message: 'Invalid Token, token is not in DB',
        success: false
      })
    }
    const currTime = Date.now();
    const tokenExpiryTime = user.emailVerificationExpiry;
    if(currTime > tokenExpiryTime){
      return res.status(400).json({
        message: 'Token expired',
        success: false
      })
    }
    if(hashedToken != user.emailVerificationToken){
      return res.status(400).json({
        message: 'Invalid token',
        success: false
      }) 
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
  
    await user.save();
    return res.status(200).json({
      message: 'Email Verification Successfull',
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
  //validation
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    if(!email){
      return res.status(400).json({
        message: 'email is required',
        success: false
      })
    }
    const user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({
        message: 'Invalid email',
        success: false
      })
    }
    if(user.isEmailVerified){
      return res.status(400).json({
        message: 'email already verified',
        success: false
      })
    }
    const { unHashedToken, hashedToken, tokenExpiry } = await user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save();
    const emailResponse = await verifyYourEmail(email, unHashedToken, 'email');
    if(!emailResponse){
      return res.status(400).json({
        message: 'Failed to Send mail',
        success: false
      })
    }
    return res.status(200).json({
      message: 'Email sent please Verify',
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
  //validation
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  
  //validation
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const token = req.cookies?.RefreshToken;
    if(!token){
      return res.status(401).json({
        message: 'Token Is Required',
        success: false
      })
    }
    const verifiedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    if(!verifiedToken){
      return res.status(401).json({
        message: 'Invalid Token',
        success: false
      })
    }
    const user = await User.findById({_id: verifiedToken?._id});
    if(!user){
      return res.status(401).json({
        message: 'token is not in db',
        success: false
      })
    }
    if(token != user.refreshToken){
      return res.status(401).json({
        message: 'db token not matched',
        success: false
      })
    }
    const newAccessToken = await user.generateAccessToken();
    const newRefreshToken = await user.generateRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save();
  
    res.cookie('RefreshToken', newRefreshToken, cookieOptions);
    res.cookie('AccessToken', newAccessToken, cookieOptions);
  
    return res.status(200).json({
      message: 'Refresh Token refreshed, please login',
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
  //validation
});

const forgotPasswordVerify = asyncHandler(async (req, res) => {
  try {
    const token = req.params['forgotToken'];
    if(!token){
      return res.status(400).json({
        message: 'Token is required',
        success: false
      })
    }
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    const user = await User.findOne({forgotPasswordToken: hashedToken}).select('-password -refreshtoken');
    if(!user){
      return res.status(400).json({
        message: 'Invalid Token, token is not in DB',
        success: false
      })
    }
    const currTime = Date.now();
    const tokenExpiryTime = user.forgotPasswordExpiry;
    if(currTime > tokenExpiryTime){
      return res.status(400).json({
        message: 'Token expired',
        success: false
      })
    }
    if(hashedToken != user.forgotPasswordToken){
      return res.status(400).json({
        message: 'Invalid token',
        success: false
      }) 
    }
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
  
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
      
    // save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // const user = await User.findById(userExist._id).select("-password -refreshToken");
  
    res.cookie('RefreshToken', refreshToken, cookieOptions);
    res.cookie('AccessToken', accessToken, cookieOptions)
  
  
    return res.status(400).json({
      message: 'Token Verification Successfull',
      user,
      refreshToken,
      success: true
    })
  } catch (error) {
    return res.status(200).json({
      message: error.message,
      success: false
    })
  }

  //validation
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    let loggedInEmail = '';
    if(req?.user){
      // loginin req
      loggedInEmail = user.email;
    }
    email = email ?? loggedInEmail;
    if(!email){
      return res.status(400).json({
        message: 'Email is Required',
        success: false
      })
    }
    const user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({
        message: 'Invalid Email',
        success: false
      })
    }
    const { unHashedToken, hashedToken, tokenExpiry } = await user.generateTemporaryToken();
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save();
    const emailResponse = await verifyYourEmail(email, unHashedToken, 'forgotpassword');
    if(!emailResponse){
      return res.status(400).json({
        message: 'Failed to Send mail',
        success: false
      })
    }
    return res.status(200).json({
      message: 'Email sent please Verify',
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
  //validation
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { password } = req.body;
    if(!req.user)
    {
      return res.status(400).json({
        message: 'Unauthorized Access',
        success: false
      })
    }
    const id = req.user._id;
    const user = await User.findById({_id: req.user._id});
    const isPasswordCorrect = user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
      return res.status(400).json({
        message: 'Invalid Password',
        success: false
      })
    }
    user.password = password;
    await user.save({validateBeforeSave: false});
    return res.status(200).json({
      message: 'Password Changed Successfully',
      success: true
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
  //validation
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    if(!req.user){
      return res.status(400).json({
        message: 'Invalid User',
        success: false
      })
    }
    const user = req.user;
    return res.status(200).json({
      message: 'All good here is user',
      success: true,
      user
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    })
  }
  //validation
});

export {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  verifyEmail,
  forgotPasswordVerify
};
