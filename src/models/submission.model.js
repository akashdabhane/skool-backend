import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fileLink: {
        type: String,
        required: true
    },
    grade: {
        type: Number,
        default: null
    },
    isLate: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Submission = mongoose.model("Submission", submissionSchema);
