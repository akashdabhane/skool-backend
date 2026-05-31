import mongoose from "mongoose";

const lectureAttendanceSchema = new mongoose.Schema({
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    joinedAt: {
        type: Date,
        required: true,
    },
    leftAt: {
        type: Date,
        default: null,
    },
    durationSeconds: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

export const LectureAttendance = mongoose.model("LectureAttendance", lectureAttendanceSchema);
