const User = require('../models/User');
const OTP = require('../models/OTP');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile = require('../models/Profile');

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

//change password