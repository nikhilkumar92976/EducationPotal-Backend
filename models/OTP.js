const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');

const OTPSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type: date,
        default: Date.now(),
        expires: 5*60 // 5 minutes
    }
   
})

//create function to send mail
async function sendVerificationEmail(email,otp){
    try{
        const mailResponse = await mailSender(email,"Free Education Services Point",otp);
        console.log('Verification email sent successfully:', mailResponse);
    }
    catch(error){
        console.error(error);
        throw new Error('Failed to send verification email');
    }
}

OTPSchema.pre('save', async function(next){
    await sendVerificationEmail(this.email,this.otp);
    next();
})


module.exports = mongoose.model('OTP',OTPSchema);