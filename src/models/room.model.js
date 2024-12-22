import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    members: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        required: true
    },
    isGroupChat: {
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
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);