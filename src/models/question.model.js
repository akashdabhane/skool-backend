import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true
    },
    question: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500
    }, 
    instruction: {
        type: String,
        required: true,
        minlength: 20,
        maxlength: 1000
    }, 
    questionType: {
        type: String,
        required: true,
        enum: ['short answer', 'multiple-choice', 'true-false']
    }, 
    dueDate: {
        type: Date,
        required: true
    },
    mediaReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaReference"
    }
}, {timestamps: true});

export const Question = mongoose.model("Question", questionSchema);
