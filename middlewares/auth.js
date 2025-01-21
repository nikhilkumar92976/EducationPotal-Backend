const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

//auth
exports.auth = async (req,res,next)=>{
    try{
        // find the token -- > using header, body and cookies any of them
        const token = req.cookies.token || req.body.token || req.header('Authorization').replace('Bearer ','');
        //validation
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Token not provided"
            });
        }
        // verify the token
        try{
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decoded);
            req.user = decoded;
        }
        catch(err){
            return res.status(403).json({
                success: false,
                message: "Token is not valid"
            });
        }
        next();
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Failed to authenticate user"
        });
    }
}

//isStrudent
exports.isStudent = async (req,res,next)=>{
    try{
        // user sespence check testing time
        if(req.user.accountType !== "Student"){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this student procted route"
            });
        }
        next();
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Failed to check user role"
        });
    }
}

//isIntructor
exports.isIntructor = async (req,res,next)=>{
    try{
        if(req.user.accountType !== "Intructor"){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this Intructor procted route"
            });
        }
        next();
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Failed to check user role"
        });
    }
}

//isAdmin
exports.isAdmin = async (req,res,next)=>{
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this Admin procted route"
            });
        }
        next();
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Failed to check user role"
        });
    }
}