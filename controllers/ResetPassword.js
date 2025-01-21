const User = require('../models/User');
const bcrypt = require('bcrypt');

//reset password token  
exporst.resetPasswordToken = async (req, res) => {
    try{
        // find email 
        const { email } = req.body;
        
        // check if user exists
        const user = await User.findOne({ email });
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        // generate a unique token
        const token = crypto.randomUUID();
        //update the user adding the token and expiration time
        const updatedUser = await User.findOneAndUpdate(
            {email:email}, // find the user based on email
            {               // update user token and expiration time
                token:token,
                resetPasswordExpires: Date.now() + 5*60*1000,
            },
            {new: true} // this help the updated user response
        )

        // create the URL
        const url = `http://localhost:3000/update-password/${token}`

        // send email with the URL
        const mailResponse = await mailSender(email, 'Reset Password',`Password reset Link: ${url}`);
        
        return res.status(200).json({
            success: true,
            message: 'Email sent successfully, please reset your password'
        })

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "reset password failed"
        })
    }
}


//reset password
exports.resetPassword = async (req,res)=>{
    try{
        //fetch data
        const { token, password, conformPassword } = req.body;
        //validate
        if(password !== conformPassword){
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            })
        }
        // get userDetails form db
        const userDetails = await User.findOne({token:token});

        //check user exists
        if(!userDetails){
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        //ckeck time is valid 
        if(userDetails.resetPasswordExpires < Date.now()) {
            return res.status(401).json({
                success: false,
                message: 'Token expired, time Limit exceeded'
            });
        }
        // hash the password
        const hashedPassword = await bcrypt.hash(password,10);
        // update password in db
        const updatedUser = await User.findOneAndUpdate(
            {token:token}, // find the user based on email
            {password: hashedPassword}, // update user password
            {new: true} // this help the updated user response
        )
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        })
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "reset password failed"
        })
    }
}