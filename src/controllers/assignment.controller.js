import { Assignment } from '../models/assignment.model.js';
import { User } from '../models/user.model.js';
import { Class } from '../models/class.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createAssignment = asyncHandler(async (req, res) => {
    const { title, description, dueDate, classroom } = req.body;

    if ([title, description, dueDate, classroom].some(field => {
        return field?.trim() === "" || field?.trim() === undefined
    })) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(401, "User not found");

    const classroomExists = await Class.findById(classroom);
    if (!classroomExists) throw new ApiError(404, "Classroom not found");

    const assignment = await Assignment.create({
        title,
        description,
        dueDate,
        class: classroom,
        createdBy: user._id
    });

    if (!assignment) {
        throw new ApiError(500, "Failed to create assignment");
    }

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
    const assignments = await Assignment.find({ class: classroom });
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
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new ApiError(404, "Assignment not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, assignment, "Assignment fetched successfully")
        );
})


const updateAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;  // assignment id
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new ApiError(404, "Assignment not found");

    if (!assignment.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to update this assignment");
    }

    const updatedAssignmentInfo = await Assignment.findByIdAndUpdate(id,
        {
            $set: req.body
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


export {
    createAssignment,
    deleteAssignment,
    getAssignment,
    getAssignments,
    updateAssignment
}