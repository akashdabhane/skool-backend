import { Classroom } from "../models/classroom.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createClassroom = asyncHandler(async (req, res) => {
    const { classname, teacher, description } = req.body;

    if ([classname, teacher, description].some((field) =>
        field?.trim() === "" || field?.trim() === undefined
    )) {
        throw new ApiError(400, "All fields are required");
    }

    const newClassroom = await Classroom.create({
        classname,
        teacher,
        description,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, newClassroom, "Classroom created successfully")
        );
})

const deleteClassroom = asyncHandler(async (req, res) => {
    const { id } = req.params;  // classroom id
    const userId = req.user._id;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    if (!classroom.teacher.equals(userId)) {
        throw new ApiError(403, "You do not have permission to delete this classroom");
    }

    await classroom.remove();

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Classroom deleted successfully")
        );
})

// get class for both students and teacher
const getAllClassrooms = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const classrooms = await Classroom.find({
        $or: [{ teacher: userId }, { students: userId }],
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, classrooms, "Classrooms retrieved successfully")
        );
})

const getClassroomById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    if (!classroom.students.includes(userId) && !classroom.teacher.equals(userId)) {
        throw new ApiError(403, "You do not have permission to view this classroom");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, classroom, "Classroom retrieved successfully")
        );
})

// only teacher has authority
const updateClassroom = asyncHandler(async (req, res) => {
    const { id } = req.params;  // classroom id
    const userId = req.user._id;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    if (!classroom.teacher.equals(userId)) {
        throw new ApiError(403, "You do not have permission to update this classroom");
    }

    const updatedClassroomInfo = await Classroom.findByIdAndUpdate(id,
        {
            $set: req.body
        },
        { runValidators: true }
    );

    if (!updatedClassroomInfo) {
        throw new ApiError(500, "Failed to update classroom");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedClassroomInfo, "Classroom updated successfully")
        );
})

// only students can join classroom
const joinClassroom = asyncHandler(async (req, res) => {
    const { id } = req.params;  // classroom id
    const userId = req.user._id;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    if (classroom.students.includes(userId)) {
        throw new ApiError(400, "You have already joined this classroom");
    }

    const updatedClassroomInfo = await Class.findByIdAndUpdate(id,
        {
            $push: { students: userId }
        },
        { new: true }
    );

    if (!updatedClassroomInfo) {
        throw new ApiError(500, "Failed to join classroom");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedClassroomInfo, "student joined classroom")
        )
})

const leaveClassroom = asyncHandler(async (req, res) => {
    const { id } = req.params;  // classroom id
    const userId = req.user._id;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    if (!classroom.students.includes(userId)) {
        throw new ApiError(400, "You are not a student in this classroom");
    }

    const updatedClassroomInfo = await Classroom.findByIdAndUpdate(id,
        {
            $pull: { students: userId }
        },
        { new: true }
    );

    if (!updatedClassroomInfo) {
        throw new ApiError(500, "Failed to leave classroom");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedClassroomInfo, "student left classroom")
        );
})

export {
    createClassroom,
    deleteClassroom,
    getAllClassrooms,
    getClassroomById,
    updateClassroom,
    joinClassroom, 
    leaveClassroom
}