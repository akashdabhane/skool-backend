import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
    },
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material",
    },
    commentMessage: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 500,
    }
}, { timestamps: true });

export const Comment = mongoose.model("Comment", commentSchema); 
