import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
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
    videoFile: {
        type: [String],
        validate: {
            validator: (v) => {
                return /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(v);
            },
            message: "Please upload a valid video file. (mp4|mov|avi|wmv|flv|mkv)"
        }
    },
    youtubeVideo: {
        type: [String],
    },
    documentFile: {
        type: [String],
        validate: {
            validator: (v) => {
                return /\.(pdf|docx|txt|xlsx|pptx)$/i.test(v);
            },
            message: "Please upload a valid document file. (pdf|docx|txt|xlsx|pptx)"
        }
    },
    Link: {
        type: [String],
        validate: {
            validator: (v) => {
                return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/.test(v);
            },
            message: "Please enter a valid URL."
        }
    },
}, { timestamps: true });

materialSchema.pre("save", async function (next) {
    if (!this.videoFile && !this.documentFile && !this.link && !this.youtubeVideo) {
        throw new Error("At least one file (video, document, or link) must be provided.");
    }
    next();
})

export const Material = mongoose.model("Material", materialSchema);