const mongoose = require('mongoose');
require('dotenv').config();

exports.connectDB = ()=>{
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
   .then(()=>console.log('MongoDB connected...'))
   .catch((err)=>{
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);  
   });
}