import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true,
    },
    commentMessage: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 500,
    }
}, { timestamps: true });

export const Comment = mongoose.model("Comment", commentSchema); 
