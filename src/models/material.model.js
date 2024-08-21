import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
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
    materialType: {
        type: String,
        required: true,
        enum: ["Book", "Document", "Video", "Link", "Other"]
    }, 
    fileLink: {
        type: String,
        required: true,
        validate: {
            validator: (v) => {
                return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/.test(v);
            },
            message: "Please enter a valid URL."
        }
    }, 
    externalLink: {     // for external website etc.
        type: String,
        validate: {
            validator: (v) => {
                return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/.test(v);
            },
            message: "Please enter a valid URL."
        }
    }
}, { timestamps: true });

export const Material = mongoose.model("Material", materialSchema);