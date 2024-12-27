const  mongoose = require('mongoose');

const courcesSchema = new mongoose.Schema({
    coursename:{
        type:String,
        required:true
    },
    courseDescription:{
        type:String,
        required:true
    },
    instructor:{
        type: mongoose.Types.Schema.ObjectId,
        ref:'User',
        required:true
    },
    whatYouWillLearn:{
        type:String,
    },
    courseContent:[
        {
            type:mongoose.Types.Schema.ObjectId,
            ref:'Section'
        }
    ],
    ratingAndReview:[
        {
            type: mongoose.Types.Schema.ObjectId,
            ref:'RatingAndReview'
        }
    ],
    price:{
        type:Number,
        required:true
    },
    thumbnail:{
        Type:String,
        required:true
    },
    tag:{
        type:mongoose.Types.Schema.ObjectId,
        ref:'Tag',
    },
    studentEnrolled:[
        {
            type: mongoose.Types.Schema.ObjectId,
            ref:'User',
            required:true
        }
    ]
})
module.exports = mongoose.model('Course',courcesSchema);