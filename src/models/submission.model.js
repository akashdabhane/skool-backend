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
    status: {
        type: String,
        enum: ["submitted", "resubmitted"],
        default: "submitted",
    },
    attemptCount: {
        type: Number,
        default: 1,
        min: 1,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    lastSubmittedAt: {
        type: Date,
        default: Date.now,
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
