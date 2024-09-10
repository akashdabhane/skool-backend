import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, 
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true,
    }, 
    announceMessage: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500,
    }, 
    mediaReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaReference",
    }
}, {timestamps: true});

export const Announcement = mongoose.model("Announcement", announcementSchema);