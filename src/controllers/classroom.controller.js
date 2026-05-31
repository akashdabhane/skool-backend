import { Classroom } from "../models/classroom.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Material } from "../models/material.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import crypto from "crypto";

const generateClassCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i += 1) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return code;
};

const generateInviteToken = () => crypto.randomBytes(16).toString("hex");

const createClassroom = asyncHandler(async (req, res) => {
    const { classname, description } = req.body;
    const teacherId = req.user?._id;

    if (!req.user?.isTeacher) {
        throw new ApiError(403, "Only teachers can create classrooms");
    }

    if ([classname, description].some((field) =>
        field?.trim() === "" || field?.trim() === undefined
    )) {
        throw new ApiError(400, "All fields are required");
    }

    let classCode = generateClassCode();
    let inviteLinkToken = generateInviteToken();

    while (await Classroom.findOne({ classCode })) {
        classCode = generateClassCode();
    }

    while (await Classroom.findOne({ inviteLinkToken })) {
        inviteLinkToken = generateInviteToken();
    }

    const newClassroom = await Classroom.create({
        classname,
        teacher: teacherId,
        description,
        classCode: classCode.toUpperCase(),
        inviteLinkToken,
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
    }).populate('teacher');

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

    const updatedClassroomInfo = await Classroom.findByIdAndUpdate(id,
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

const joinClassroomByCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const userId = req.user._id;

    const normalizedCode = code?.trim().toUpperCase();
    if (!normalizedCode) {
        throw new ApiError(400, "Class code is required");
    }

    const classroom = await Classroom.findOne({ classCode: normalizedCode });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    if (classroom.students.includes(userId)) {
        throw new ApiError(400, "You have already joined this classroom");
    }

    const updatedClassroomInfo = await Classroom.findByIdAndUpdate(classroom._id,
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
        );
});

const joinClassroomByLink = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const userId = req.user._id;

    const classroom = await Classroom.findOne({ inviteLinkToken: token });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    if (classroom.students.includes(userId)) {
        throw new ApiError(400, "You have already joined this classroom");
    }

    const updatedClassroomInfo = await Classroom.findByIdAndUpdate(classroom._id,
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
        );
});

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

const kickStudent = asyncHandler(async (req, res) => {
    const { classId, studentId } = req.params;
    const userId = req.user._id;

    const classroom = await Classroom.findById(classId);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    if (!classroom.teacher.equals(userId)) {
        throw new ApiError(403, "You do not have permission to remove students");
    }

    if (!classroom.students.includes(studentId)) {
        throw new ApiError(400, "Student is not in this classroom");
    }

    const updatedClassroom = await Classroom.findByIdAndUpdate(classId,
        {
            $pull: { students: studentId }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedClassroom, "Student removed successfully")
        );
});


const getAssignmentsAndMaterials = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;  // classroom id

    const classroom = await Classroom.findById(id);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    if (!classroom.students.includes(userId) && !classroom.teacher.equals(userId)) {
        throw new ApiError(403, "You do not have permission to view this classroom");
    }

    const assignments = await Assignment.find({ classroom: id });
    const materials = await Material.find({ classroom: id });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { assignments, materials }, "Classroom assignments and materials retrieved successfully")
        );
})


const getConnectedPeople = asyncHandler(async (req, res) => {
    const { id } = req.params;    // classroom id

    const classroom = await Classroom.findById(id);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    // const connectedPeople = classroom.students.map(studentId => {
    //     const student = User.findById(studentId);
    //     return student;
    // });

    const connectedPeople = await Classroom.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "students",
                foreignField: "_id",
                as: "connectedStudents"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "teacher",
                foreignField: "_id",
                as: "connectedTeachers"
            }
        },
        {
            $project: {
                _id: 1,
                "connectedTeachers._id": 1,
                "connectedTeachers.firstname": 1,
                "connectedTeachers.lastname": 1,
                "connectedTeachers.profilePicture": 1,
                "connectedStudents._id": 1,
                "connectedStudents.firstname": 1,
                "connectedStudents.lastname": 1,
                "connectedStudents.profilePicture": 1,
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, connectedPeople, "Connected students & teachers retrieved successfully")
        );
})

export {
    createClassroom,
    deleteClassroom,
    getAllClassrooms,
    getClassroomById,
    updateClassroom,
    joinClassroom,
    joinClassroomByCode,
    joinClassroomByLink,
    leaveClassroom,
    kickStudent,
    getAssignmentsAndMaterials,
    getConnectedPeople,
}