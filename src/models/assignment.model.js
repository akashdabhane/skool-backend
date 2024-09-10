import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true, 
        minlength: 2,
        maxlength: 500
    },
    dueDate: {
        type: Date,
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true
    }, 
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }, 
    mediaReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaReference",
    }
}, { timestamps: true });

export const Assignment = mongoose.model("Assignment", assignmentSchema);
