import { User } from '../models/user.model.js';
import { Submission } from '../models/submission.model.js';
import { Assignment } from "../models/assignment.model.js"
import { Classroom } from "../models/classroom.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { extractPublicId } from '../utils/extractPublicId.js';

const createSubmission = asyncHandler(async (req, res) => {
    const { assignmentId } = req.body;
    const localFilePath = req.file?.path;

    if (!assignmentId) {
        throw new ApiError(400, "assignmentId is required");
    }

    if (!localFilePath) {
        throw new ApiError(400, "No file uploaded");
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new ApiError(404, "Assignment not found");

    const user = await User.findById(req.user._id); // student field from here
    if (!user) throw new ApiError(401, "User not found");

    const classroomExists = await Classroom.findById(assignment.classroom);
    if (!classroomExists) throw new ApiError(404, "Classroom not found");

    if (!classroomExists.students.includes(user._id)) {
        throw new ApiError(400, "You are not a student in this classroom");
    }

    const assignmentFile = await uploadOnCloudinary(localFilePath);
    if (!assignmentFile) {
        throw new ApiError(500, "Failed to upload submission file");
    }

    // compare dueDate and current for marking isLate
    // Check if the uploadDate is after the dueDate
    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);

    const existingSubmission = await Submission.findOne({
        assignment: assignmentId,
        student: user._id,
    });

    let submission;

    if (existingSubmission) {
        if (now > new Date(assignment.dueDate)) {
            throw new ApiError(400, "Resubmissions are only allowed before the deadline");
        }

        const publicId = extractPublicId(existingSubmission.fileLink);
        await deleteFromCloudinary(publicId);

        submission = await Submission.findByIdAndUpdate(existingSubmission._id,
            {
                $set: {
                    fileLink: assignmentFile.secure_url,
                    status: "resubmitted",
                    lastSubmittedAt: now,
                },
                $inc: { attemptCount: 1 },
            },
            { new: true }
        );
    } else {
        submission = await Submission.create({
            fileLink: assignmentFile.secure_url,
            assignment: assignmentId,
            student: user._id,
            isLate,
            status: "submitted",
            submittedAt: now,
            lastSubmittedAt: now,
        });
    }

    if (!submission) throw new ApiError(500, "Failed to create submission");

    return res
        .status(201)
        .json(
            new ApiResponse(201, { submission }, "Submission created successfully")
        );
});

const getSubmissionStatus = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const userId = req.user._id;

    const submission = await Submission.findOne({ assignment: assignmentId, student: userId });

    return res
        .status(200)
        .json(
            new ApiResponse(200, submission, "Submission status fetched successfully")
        );
});

const getAllSubmissions = asyncHandler(async (req, res) => {
    const { id } = req.params;  // assignment id

    const submissions = await Submission.find({ assignment: id });
    if (!submissions) throw new ApiError(404, "Submission not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, submissions, "Submission fetched successfully")
        );
});

const getSubmission = asyncHandler(async (req, res) => {
    const { id } = req.params;  // assignment id
    const userId = req.user._id;

    const submission = await Submission.findOne({
        $and: [{ _id: id }, { student: userId }]
    });
    if (!submission) throw new ApiError(404, "Submission not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, submission, "Submission fetched successfully")
        );
})

const deleteSubmission = asyncHandler(async (req, res) => {
    const { id } = req.params;  // submission id

    const submission = await Submission.findById(id);
    if (!submission) throw new ApiError(404, "Submission not found");

    const user = await User.findById(req.user._id); // student field from here
    if (!user) throw new ApiError(401, "User not found");

    if (!submission.student.equals(user._id)) {
        throw new ApiError(401, "Unauthorized to delete this submission");
    }

    const publicId = extractPublicId(submission.fileLink);
    await deleteFromCloudinary(publicId);
    await Submission.findByIdAndDelete(submission._id);

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Submission deleted successfully")
        );
});


export {
    createSubmission,
    deleteSubmission,
    getAllSubmissions,
    getSubmission,
    getSubmissionStatus,
}