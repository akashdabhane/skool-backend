import { Resource } from "../models/resource.model.js";
import { Classroom } from "../models/classroom.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { extractPublicId } from "../utils/extractPublicId.js";

const createResource = asyncHandler(async (req, res) => {
    const { classroom, title, description, resourceType, linkUrl } = req.body;
    const userId = req.user._id;

    if (!req.user?.isTeacher) {
        throw new ApiError(403, "Only teachers can create resources");
    }

    if ([classroom, title, description].some((field) =>
        field?.trim() === "" || field?.trim() === undefined
    )) {
        throw new ApiError(400, "All fields are required");
    }

    const classroomExists = await Classroom.findById(classroom);
    if (!classroomExists) {
        throw new ApiError(404, "Classroom not found");
    }

    if (!classroomExists.teacher.equals(userId)) {
        throw new ApiError(403, "You do not have permission to add resources");
    }

    let resolvedType = resourceType;
    if (!resolvedType) {
        resolvedType = req.file?.path ? "file" : "link";
    }

    let fileUrl = "";
    if (resolvedType === "file") {
        const localFilePath = req.file?.path;
        if (!localFilePath) {
            throw new ApiError(400, "File is required for file resources");
        }

        const uploadedFile = await uploadOnCloudinary(localFilePath);
        if (!uploadedFile) {
            throw new ApiError(500, "Failed to upload file");
        }

        fileUrl = uploadedFile.secure_url;
    }

    if (resolvedType === "link" && (!linkUrl || linkUrl.trim() === "")) {
        throw new ApiError(400, "linkUrl is required for link resources");
    }

    const resource = await Resource.create({
        classroom,
        createdBy: userId,
        title,
        description,
        resourceType: resolvedType,
        fileUrl,
        linkUrl: resolvedType === "link" ? linkUrl : "",
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, resource, "Resource created successfully")
        );
});

const getResourcesByClassroom = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const userId = req.user._id;

    const classroom = await Classroom.findById(classId);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    const isStudent = classroom.students.includes(userId);
    const isTeacher = classroom.teacher.equals(userId);

    if (!isStudent && !isTeacher) {
        throw new ApiError(403, "You do not have permission to view resources");
    }

    const resources = await Resource.find({ classroom: classId });

    return res
        .status(200)
        .json(
            new ApiResponse(200, resources, "Resources fetched successfully")
        );
});

const updateResource = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, linkUrl } = req.body;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    const classroom = await Classroom.findById(resource.classroom);
    if (!classroom || !classroom.teacher.equals(userId)) {
        throw new ApiError(403, "You do not have permission to update this resource");
    }

    let updatePayload = {
        title,
        description,
    };

    if (resource.resourceType === "link") {
        if (!linkUrl || linkUrl.trim() === "") {
            throw new ApiError(400, "linkUrl is required for link resources");
        }
        updatePayload.linkUrl = linkUrl;
    }

    if (resource.resourceType === "file" && req.file?.path) {
        const uploadedFile = await uploadOnCloudinary(req.file.path);
        if (!uploadedFile) {
            throw new ApiError(500, "Failed to upload file");
        }

        if (resource.fileUrl) {
            const publicId = extractPublicId(resource.fileUrl);
            await deleteFromCloudinary(publicId);
        }

        updatePayload.fileUrl = uploadedFile.secure_url;
    }

    const updatedResource = await Resource.findByIdAndUpdate(id,
        { $set: updatePayload },
        { new: true, runValidators: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedResource, "Resource updated successfully")
        );
});

const deleteResource = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    const classroom = await Classroom.findById(resource.classroom);
    if (!classroom || !classroom.teacher.equals(userId)) {
        throw new ApiError(403, "You do not have permission to delete this resource");
    }

    if (resource.fileUrl) {
        const publicId = extractPublicId(resource.fileUrl);
        await deleteFromCloudinary(publicId);
    }

    await Resource.findByIdAndDelete(id);

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Resource deleted successfully")
        );
});

export {
    createResource,
    getResourcesByClassroom,
    updateResource,
    deleteResource,
};
