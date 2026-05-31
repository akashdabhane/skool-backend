import mongoose from "mongoose";

const examFlagSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: [
            "tab-switch",
            "visibility-change",
            "copy-paste",
            "face-missing",
            "multiple-faces",
            "unknown",
        ],
        required: true,
    },
    severity: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });

export const ExamFlag = mongoose.model("ExamFlag", examFlagSchema);
