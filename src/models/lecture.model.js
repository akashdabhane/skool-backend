import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    attendees: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User"
    },
    duration: {
        type: Number,
        required: true
    }
}, { timestamps: true });

export const Lecture = mongoose.model("Lecture", lectureSchema);