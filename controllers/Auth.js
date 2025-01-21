const User = require('../models/User');
const OTP = require('../models/OTP');
const Profile = require('../models/Profile');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mailSender =  require('../utils/mailSender')


//send otp
exports.sendOTP = async (req,res)=>{
    try{
        //step 1: fetch the email in request ki body
        const {email} = req.body;
        
        //step 2: check if the user already exists in the database
        const checkUserPresent = await User.findOne({email});
        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message: 'User already exists'
            })
        }

        //step 3: generate a random 6 digit OTP
        var otp = otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        }) 

        //check otp is unique or not
        let result = await OTP.findOne({otp:otp});
        //if otp present genetate new otp
        while(result){
            otp = otpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false
            })
            result = await OTP.findOne({otp:otp});
        }

        //create entry in database
        const payload = {email,otp};
        const otpEntry = await OTP.create(payload);
        console.log(otpEntry);

        //return success
        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otp,
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}


//sing up
exports.singUp = async (req, res) =>{
    try{
        //fetch data
        const {firstName, lastName,email, password,conformPassword,accountType,contactNumber,otp} = req.body;
        //validate all data
        if(!firstName ||!lastName ||!email ||!password ||!conformPassword || !otp){
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            })
        }
        //check passwords are equal
        if(password !== conformPassword){
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            })
        }
        // check user present or not
        const checkUserPresent = await User.findOne({email});
        if(checkUserPresent){
            return res.status(401).json({
                success: false,
                message: 'User already exists'
            })
        }
        //find most recently entered user otp in db
        const recentOTP = await OTP.findOne({email}).sort({createdAt: -1}).limit(1);
        //check if otp is valid or not
        if(!recentOTP || recentOTP.otp!== otp){
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            })
        }
        //hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        //create user entry in database
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth: null,
            about:null,
            contactNumber: contactNumber,
        }) 
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails:profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        })
        //return result
        return res.status(200).json({
            success: true,
            message: 'User created successfully',
            user
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}


//login
exports.login = async (req,res)=>{
    try{
        //fetch data
        const {email,password} = req.body;
        //validate all data
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            })
        }
        //check user present or not           , no any not to populate the user
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'User is not registered, please sing up first'
            })
        }
        //generate JWT token after password matching
        if(await bcrypt.compare(password,user.password)){
            const payload = {
                email: user.email,
                id:user._id,
                accountType: user.accountType, 
            }

            //generate token
            const token = jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn: '2h',
            })
            user.token = token
            user.password = undefined

            //create cookies and send response
            const options = {
                expires: new Date(Date.now() + 3* 24 * 60 * 60 * 1000),
                httpOnly: true
            }
            return res.cookie("token",token,options).status(200).json({
                success: true,
                message: 'Login successful',
                user,
                token
            })
        }else{
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            })
        }
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "login failed, please try again"
        });
    }
}


//change password
exports.changePassword = async (req,res)=>{
    try{
        //find all data 
        const {email,newPassword,conformPassword,oldPassword} = req.body;
        //validate all data 
        if(!email || !newPassword || !conformPassword || !oldPassword){
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            })
        }
        //check password are matches
        if(newPassword !== oldPassword){
            return res.status(400).json({
                success: false,
                message: 'newpassword ans conformPassword does not match'
            })
        }
        // get the user data in db
        const user = await User.findOne({email});
        // if user not present
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'User is not registered'
            })
        }
        // if user present hash the password ans save the password
       const hashedPassword = await bcrypt.hash(newPassword,10);
       user.password = hashedPassword;
       await user.save();

       // send email notification with the helpe of mailsender function
        await mailSender(email,"Change Password Sucessfully","Update Password Sucessfully in Database");

       // return success message  after password change  with updated user data
       return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Failed to change password, please try again'
        })
    }
}