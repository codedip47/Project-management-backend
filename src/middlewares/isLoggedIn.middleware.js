import jwt from 'jsonwebtoken'
import { User } from '../models/user.models.js';

async function isLoggedIn(req, res, next){
    try {
        const token = req.cookies?.AccessToken;
        if(!token){
            return res.status(401).json({
                message: 'Token is required'
            })
        }
        const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if(!verifiedToken){
            return res.status(401).json({
                message: 'Invalid Token'
            })
        }
        const user = await User.findById(verifiedToken?._id).select("-password -refreshToken");
        if(!user){
            return res.status(401).json({
                message: 'Invalid Token'
            })
        }
    
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: error.message
        })
    }
}

export default isLoggedIn;