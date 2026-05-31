import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100,
    },
    description: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 500,
    },
    resourceType: {
        type: String,
        enum: ["file", "link"],
        required: true,
    },
    fileUrl: {
        type: String,
        default: "",
    },
    linkUrl: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export const Resource = mongoose.model("Resource", resourceSchema);
