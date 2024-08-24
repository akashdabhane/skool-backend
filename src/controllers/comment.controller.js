import { User } from '../models/user.model.js';
import { Assignment } from "../models/assignment.model.js";
import { Material } from "../models/material.model.js";
import { Comment } from '../models/comment.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validateMongodbId } from "../utils/validateMongodbId.js";

const createComment = asyncHandler(async (req, res) => {
    const { assignmentId, materialId, commentMessage } = req.body;
    // validateMongodbId(assignmentId);
    // validateMongodbId(materialId);

    if ([assignmentId, materialId].some(field => {
        field?.trim() === "" || field?.trim() === undefined;
    })) {
        throw new ApiError(400, "All fields are required");
    }

    if (!commentMessage) {
        throw new ApiError(400, "All fields are required");
    }

    if (assignmentId) {
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) throw new ApiError(404, "Submission not found");
    }

    if (materialId) {
        const material = await Material.findById(materialId);

        if (!material) throw new ApiError(404, "Submission not found");
    }

    const comment = await Comment.create({
        commentMessage,
        user: req.user._id,
        assignmentId: req?.body?.assignmentId,
        materialId: req?.body?.materialId
    });

    if (!comment) {
        throw new ApiError(500, "Failed to create comment");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, comment, "Comment created successfully")
        );
})

const getAllComments = asyncHandler(async (req, res) => {
    const { id } = req.params;  // assignmentId   
    // validateMongodbId(assignmentId);
    // validateMongodbId(materialId);

    if (!id) {
        throw new ApiError(400, "Either assignmentId or materialId is required");
    }

    let comments;
    // if (assignmentId) {
    comments = await Comment.find({ assignmentId: id });
    // } else if (materialId) {
    //     comments = await Comment.find({ materialId: materialId });
    // }

    if (!comments) {
        throw new ApiError(404, "No comments found for this submission");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comments fetched successfully")
        );
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    validateMongodbId(commentId);

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!comment.user.equals(req.user._id)) {
        throw new ApiError(401, "Unauthorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Comment deleted successfully")
        );
})

const updateComment = asyncHandler(async (req, res) => {
    const { id } = req.params;    // comment id 
    const { updatedMessage } = req.body;
    validateMongodbId(id);

    if (!updatedMessage || updatedMessage.trim() === "") {
        throw new ApiError(400, "Updated comment message is required");
    }

    const comment = await Comment.findByIdAndUpdate(id,
        {
            $set: { commentMessage: updatedMessage }
        },
        { new: true, runValidation: true });

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment updated successfully")
        );
})

export {
    createComment,
    deleteComment,
    getAllComments,
    updateComment
}
