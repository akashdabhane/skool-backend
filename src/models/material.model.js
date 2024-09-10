import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true,
    },
    title: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 500
    },
    mediaReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaReference",
        required: true
    }
}, { timestamps: true });

export const Material = mongoose.model("Material", materialSchema);