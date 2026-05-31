import mongoose from "mongoose";

const examProctorSessionSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
    },
    attempt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExamAttempt",
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "ended", "terminated"],
        default: "active",
    },
    startedAt: {
        type: Date,
        required: true,
    },
    endedAt: {
        type: Date,
        default: null,
    },
    riskScore: {
        type: Number,
        default: 0,
    },
    totalViolations: {
        type: Number,
        default: 0,
    },
    tabSwitchCount: {
        type: Number,
        default: 0,
    },
    copyPasteCount: {
        type: Number,
        default: 0,
    },
    lastFlagAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export const ExamProctorSession = mongoose.model("ExamProctorSession", examProctorSessionSchema);
