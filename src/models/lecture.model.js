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
    },
    title: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    topic: {
        type: String,
    },
    status: {
        type: String,
        enum: ['ongoing', 'scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    scheduleStart: {
        type: Date,
        required: true,
    },
    scheduleEnd: {
        type: Date,
        required: true,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurrenceRule: {
        type: String,
        default: "",
    },
    cancelReason: {
        type: String,
        default: "",
    }
}, { timestamps: true });

export const Lecture = mongoose.model("Lecture", lectureSchema);