import mongoose, { Mongoose } from "mongoose";

const mediaReferenceSchema = new mongoose.Schema({
    videoFile: {
        type: [String],
        // validate: {
        //     validator: (v) => {
        //         return /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(v);
        //     },
        //     message: "Please upload a valid video file. (mp4|mov|avi|wmv|flv|mkv)"
        // }
    },
    youtubeVideo: {
        type: [String],
    },
    documentFile: {
        type: [String],
        // validate: {
        //     validator: (v) => {
        //         return /\.(pdf|docx|txt|xlsx|pptx)$/i.test(v);
        //     },
        //     message: "Please upload a valid document file. (pdf|docx|txt|xlsx|pptx)"
        // }
    },
    link: {
        type: [String],
        // validate: {
        //     validator: (v) => {
        //         return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/.test(v);
        //     },
        //     message: "Please enter a valid URL."
        // }
    },
}, {timestamps: true});

mediaReferenceSchema.pre("save", async function (next) {
    if ((!this.videoFile || this.videoFile === "") && 
    (!this.documentFile || this.documentFile==="") && 
    (!this.link || this.link==="") && 
    (!this.youtubeVideo || this.youtubeVideo==="")) {
        throw new Error("At least one file (video, document, or link) must be provided.");
    }
    next();
})

export const MediaReference = mongoose.model("MediaReference", mediaReferenceSchema);