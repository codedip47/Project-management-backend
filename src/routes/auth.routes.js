import { Router } from "express";
import { changeCurrentPassword, 
    forgotPasswordRequest, forgotPasswordVerify, 
    getCurrentUser, loginUser, 
    logoutUser, refreshAccessToken, 
    registerUser, resendEmailVerification, 
    verifyEmail } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterValidator } from "../validators/index.js";
import { upload } from '../middlewares/multer.middleware.js'
import isLoggedIn from "../middlewares/isLoggedIn.middleware.js";
import multer from "multer";
const multerFormDataHandler = multer();


const router = Router();

// userRegisterValidator(), validate,

// router.route("/register")
// .post(registerUser);
router.post('/register', upload.single('avatar'), registerUser);
router.post('/login', loginUser);
router.post('/logout', isLoggedIn, logoutUser);
router.patch('/changepassword',isLoggedIn, changeCurrentPassword);
router.post('/verify/forgotpassword/:forgotToken', forgotPasswordVerify);
router.post('/verify/email/:token', verifyEmail);
router.post('/resendemailverification', resendEmailVerification);
router.post('/forgotpassword', forgotPasswordRequest);
router.post('/resetforgotpassword', forgotPasswordRequest);
router.get('/profile', isLoggedIn, getCurrentUser);
router.post('/refreshaccesstoken', refreshAccessToken);


export default router;
