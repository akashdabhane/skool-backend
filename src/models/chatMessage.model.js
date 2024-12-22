import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
    },
    message: {
        type: String,
        required: true,
        minlength: 1,
    },
    attactment: {
        type: String,
        required: false,
        default: "",
    },


    // receiver: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //     required: true,
    // },
    // content: {
    //     type: String,
    //     required: true,
    //     minlength: 1,
    //     maxlength: 1000,
    // },
    // isRead: {
    //     type: Boolean,
    //     default: false,
    // },
    // conversationId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Conversation",
    //     required: true,
    // },
    // classroom: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Classroom",
    //     required: true,
    // },
    // isGroup: {
    //     type: Boolean,
    //     default: false,
    // },
    // group: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Group"
    // }
}, { timestamps: true });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
