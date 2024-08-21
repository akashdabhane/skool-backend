import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
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
        required: true,
    },
    description: {
        type: String,
        required: true,
    }
}, { timestamps: true });

export const Class = mongoose.model("Class", classSchema);
