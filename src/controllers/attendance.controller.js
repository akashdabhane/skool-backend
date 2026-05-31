import { Lecture } from "../models/lecture.model.js";
import { Classroom } from "../models/classroom.model.js";
import { LectureAttendance } from "../models/lectureAttendance.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ensureLectureAccess = async (lectureId, userId) => {
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
        throw new ApiError(404, "Lecture not found");
    }

    const classroom = await Classroom.findById(lecture.classroom);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    const isStudent = classroom.students?.some((studentId) => studentId.equals(userId));
    const isTeacher = classroom.teacher.equals(userId);

    if (!isStudent && !isTeacher) {
        throw new ApiError(403, "Unauthorized");
    }

    return { lecture, classroom, isTeacher };
};

const joinLectureAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lecture } = await ensureLectureAccess(id, req.user._id);

    const existing = await LectureAttendance.findOne({
        lecture: lecture._id,
        student: req.user._id,
        leftAt: null,
    });

    if (existing) {
        return res.status(200).json(new ApiResponse(200, existing, "Attendance already started"));
    }

    const attendance = await LectureAttendance.create({
        lecture: lecture._id,
        student: req.user._id,
        joinedAt: new Date(),
    });

    return res.status(201).json(new ApiResponse(201, attendance, "Attendance started"));
});

const leaveLectureAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ensureLectureAccess(id, req.user._id);

    const attendance = await LectureAttendance.findOne({
        lecture: id,
        student: req.user._id,
        leftAt: null,
    });

    if (!attendance) {
        return res.status(200).json(new ApiResponse(200, null, "No active attendance"));
    }

    const leftAt = new Date();
    const durationSeconds = Math.max(
        0,
        Math.floor((leftAt.getTime() - attendance.joinedAt.getTime()) / 1000)
    );

    attendance.leftAt = leftAt;
    attendance.durationSeconds = durationSeconds;
    await attendance.save();

    return res.status(200).json(new ApiResponse(200, attendance, "Attendance ended"));
});

const getLectureAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lecture, classroom, isTeacher } = await ensureLectureAccess(id, req.user._id);

    if (!isTeacher) {
        throw new ApiError(403, "Only teachers can view attendance");
    }

    const records = await LectureAttendance.find({ lecture: lecture._id })
        .populate("student", "firstname lastname email")
        .sort({ joinedAt: -1 });

    const totalStudents = classroom.students?.length || 0;
    const totalRecords = records.length;
    const totalDuration = records.reduce((sum, record) => sum + (record.durationSeconds || 0), 0);
    const averageDuration = totalRecords ? Math.round(totalDuration / totalRecords) : 0;

    return res.status(200).json(new ApiResponse(200, {
        records,
        summary: {
            totalStudents,
            totalRecords,
            averageDuration,
        }
    }, "Attendance fetched"));
});

const getMyAttendance = asyncHandler(async (req, res) => {
    const records = await LectureAttendance.find({ student: req.user._id })
        .populate("lecture", "title scheduleStart scheduleEnd classroom")
        .sort({ joinedAt: -1 });

    return res.status(200).json(new ApiResponse(200, records, "Attendance fetched"));
});

export {
    joinLectureAttendance,
    leaveLectureAttendance,
    getLectureAttendance,
    getMyAttendance,
};
