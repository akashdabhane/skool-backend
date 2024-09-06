import { Material } from '../models/material.model.js';
import { MediaReference } from '../models/mediaReference.model.js';
import { User } from '../models/user.model.js';
import { Class } from '../models/class.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createMaterial = asyncHandler(async (req, res) => {
    const { title, description, classroom } = req.body;

    if ([title, description, classroom].some(field => {
        return field?.trim() === "" || field?.trim() === undefined
    })) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(401, "User not found");

    const classroomExists = await Class.findById(classroom);
    if (!classroomExists) throw new ApiError(404, "Classroom not found");

    const media = await MediaReference.create({
        videoFile: req?.body?.videoFile, 
        youtubeVideo: req?.body?.youtubeVideo, 
        documentFile: req?.body?.documentFile, 
        Link: req?.body?.link 
    });

    if(!media) {
        throw new ApiError(500, "Failed to create media reference");
    }

    const material = await Material.create({
        title,
        description,
        class: classroom,
        createdBy: user._id, 
        mediaReference: media._id  // save media reference id in material document
    });

    if (!material) {
        throw new ApiError(500, "Failed to create material");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, material, "Material created successfully")
        );
})

const deleteMaterial = asyncHandler(async (req, res) => {
    const { id } = req.params;  // material id
    const material = await Material.findById(id);
    if (!material) throw new ApiError(404, "Material not found");

    if (!material.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to delete this material");
    }

    await MediaReference.findByIdAndDelete(material.mediaReference);  // delete media reference first

    await Material.findByIdAndDelete(id);
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Material deleted successfully")
        );
})

// all materials of classroom
const getMaterials = asyncHandler(async (req, res) => {
    const { classroom } = req.params;
    const materials = await Material.find({ class: classroom });
    if (!materials) {
        throw new ApiError(404, "No materials found for this classroom");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, materials, "Materials fetched successfully")
        );
})

// get single material
const getMaterial = asyncHandler(async (req, res) => {
    const { id } = req.params;  // material id
    const material = await Material.findById(id);
    if (!material) throw new ApiError(404, "Material not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, material, "Material fetched successfully")
        );
})

const updateMaterial = asyncHandler(async (req, res) => {
    const { id } = req.params;  // material id
    const material = await Material.findById(id);
    if (!material) throw new ApiError(404, "Material not found");

    if (!material.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to update this material");
    }

    const updatedMaterialInfo = await Material.findByIdAndUpdate(id,
        {
            $set: req.body
        },
        { new: true, runValidators: true }
    );
    if (!updatedMaterialInfo) {
        throw new ApiError(500, "Failed to update material information");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { material: updatedMaterialInfo }, "Material information updated successfully")
        );
})


export {
    createMaterial,
    deleteMaterial,
    getMaterial,
    getMaterials,
    updateMaterial
}