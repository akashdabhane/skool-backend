import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true
    },
    members: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        required: true
    },
    isGroupChat: {
        type: Boolean,
        default: false
    },
    isClassroomRoom: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 20
    },
    admins: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatMessage",
        default: null
    }
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);