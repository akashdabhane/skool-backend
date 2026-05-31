import { Assignment } from '../models/assignment.model.js';
import { User } from '../models/user.model.js';
import { Classroom } from '../models/classroom.model.js';
import { MediaReference } from "../models/mediaReference.model.js";
import { Submission } from "../models/submission.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { extractPublicId } from "../utils/extractPublicId.js";
import { emitNotificationToUsers } from "../utils/notificationEmitter.js";

const createAssignment = asyncHandler(async (req, res) => {
    const { title, description, dueDate, classroom, points, link } = req.body;

    if ([title, description, dueDate, classroom].some(field => {
        return field?.trim() === "" || field?.trim() === undefined
    })) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(401, "User not found");

    if (!user.isTeacher) {
        throw new ApiError(403, "Only teachers can create assignments");
    }

    const classroomExists = await Classroom.findById(classroom);
    if (!classroomExists) throw new ApiError(404, "Classroom not found");

    if (!classroomExists.teacher.equals(user._id)) {
        throw new ApiError(403, "You do not have permission to create assignments for this classroom");
    }

    let mediaReference = null;
    const localFilePath = req.file?.path;
    if (localFilePath || link) {
        const documentFileUrls = [];
        if (localFilePath) {
            const uploadedFile = await uploadOnCloudinary(localFilePath);
            if (!uploadedFile) {
                throw new ApiError(500, "Failed to upload assignment file");
            }
            documentFileUrls.push(uploadedFile.secure_url);
        }

        mediaReference = await MediaReference.create({
            documentFile: documentFileUrls,
            link: link ? [link] : [],
        });
    }

    const assignment = await Assignment.create({
        title,
        description,
        dueDate,
        classroom,
        createdBy: user._id,
        points: points !== undefined ? points : null,
        mediaReference: mediaReference?._id || null,
    });

    if (!assignment) {
        throw new ApiError(500, "Failed to create assignment");
    }

    const recipientIds = [classroomExists.teacher, ...(classroomExists.students || [])];
    await emitNotificationToUsers({
        userIds: recipientIds,
        classroom: classroomExists._id,
        type: "assignment",
        message: `New assignment in ${classroomExists.classname}`,
        link: `/c/a/${assignment._id}`
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, assignment, "Assignment created successfully")
        );
})

const deleteAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;  // assignment id
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new ApiError(404, "Assignment not found");

    if (!assignment.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to delete this assignment");
    }

    await Assignment.findByIdAndDelete(id);
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Assignment deleted successfully")
        );
})

// all assignments of classroom
const getAssignments = asyncHandler(async (req, res) => {
    const { classroom } = req.params;
    const assignments = await Assignment.find({ classroom: classroom }).populate("mediaReference");
    if (!assignments) {
        throw new ApiError(404, "No assignments found for this classroom");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, assignments, "Assignments fetched successfully")
        );
})

// get single assignment
const getAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;  // assignment id
    const assignment = await Assignment.findById(id).populate("mediaReference");
    if (!assignment) throw new ApiError(404, "Assignment not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, assignment, "Assignment fetched successfully")
        );
})


const updateAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;  // assignment id
    const { link, points } = req.body;
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new ApiError(404, "Assignment not found");

    if (!assignment.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to update this assignment");
    }

    const user = await User.findById(req.user._id);
    if (!user?.isTeacher) {
        throw new ApiError(403, "Only teachers can update assignments");
    }

    let mediaReferenceId = assignment.mediaReference;
    const localFilePath = req.file?.path;

    if (localFilePath || link) {
        const documentFileUrls = [];
        if (localFilePath) {
            const uploadedFile = await uploadOnCloudinary(localFilePath);
            if (!uploadedFile) {
                throw new ApiError(500, "Failed to upload assignment file");
            }

            documentFileUrls.push(uploadedFile.secure_url);
        }

        if (mediaReferenceId) {
            const existingMedia = await MediaReference.findById(mediaReferenceId);
            if (existingMedia?.documentFile?.length && localFilePath) {
                const publicId = extractPublicId(existingMedia.documentFile[0]);
                await deleteFromCloudinary(publicId);
            }

            await MediaReference.findByIdAndUpdate(mediaReferenceId,
                {
                    $set: {
                        documentFile: documentFileUrls.length ? documentFileUrls : existingMedia.documentFile,
                        link: link ? [link] : existingMedia.link,
                    }
                },
                { new: true, runValidators: true }
            );
        } else {
            const newMedia = await MediaReference.create({
                documentFile: documentFileUrls,
                link: link ? [link] : [],
            });
            mediaReferenceId = newMedia._id;
        }
    }

    const updatedAssignmentInfo = await Assignment.findByIdAndUpdate(id,
        {
            $set: {
                title: req?.body?.title || assignment.title,
                description: req?.body?.description || assignment.description,
                dueDate: req?.body?.dueDate || assignment.dueDate,
                points: points !== undefined ? points : assignment.points,
                mediaReference: mediaReferenceId,
            }
        },
        { new: true, runValidators: true }
    );
    if (!updatedAssignmentInfo) {
        throw new ApiError(500, "Failed to update assignment information");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { assignment: updatedAssignmentInfo }, "Assignment information updated successfully")
        );
})

const getAssignmentStats = asyncHandler(async (req, res) => {
    const { id } = req.params;  // assignment id

    const assignment = await Assignment.findById(id);
    if (!assignment) throw new ApiError(404, "Assignment not found");

    if (!assignment.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to view assignment stats");
    }

    const totalSubmissions = await Submission.countDocuments({ assignment: id });
    const lateSubmissions = await Submission.countDocuments({ assignment: id, isLate: true });
    const gradedSubmissions = await Submission.find({ assignment: id, grade: { $ne: null } }).select("grade");
    const avgGrade = gradedSubmissions.length
        ? gradedSubmissions.reduce((sum, item) => sum + item.grade, 0) / gradedSubmissions.length
        : null;

    return res
        .status(200)
        .json(
            new ApiResponse(200, {
                totalSubmissions,
                lateSubmissions,
                averageGrade: avgGrade,
            }, "Assignment stats fetched successfully")
        );
});


export {
    createAssignment,
    deleteAssignment,
    getAssignment,
    getAssignments,
    updateAssignment,
    getAssignmentStats,
}