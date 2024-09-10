import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema({
    classname: {
        type: String,
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    students: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
    },
    description: {
        type: String,
        required: true,
    }
}, { timestamps: true });

export const Classroom = mongoose.model("Classroom", classroomSchema);
