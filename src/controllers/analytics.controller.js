import { Classroom } from "../models/classroom.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import { Lecture } from "../models/lecture.model.js";
import { LectureAttendance } from "../models/lectureAttendance.model.js";
import { Exam, ExamAttempt } from "../models/exam.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ensureClassroomAccess = async (classId, userId) => {
    const classroom = await Classroom.findById(classId);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    const isTeacher = classroom.teacher.equals(userId);
    const isStudent = classroom.students?.some((studentId) => studentId.equals(userId));

    if (!isTeacher && !isStudent) {
        throw new ApiError(403, "Unauthorized");
    }

    return { classroom, isTeacher, isStudent };
};

const calculateAverage = (items) => {
    if (!items.length) return null;
    const total = items.reduce((sum, value) => sum + value, 0);
    return total / items.length;
};

const getTeacherAnalytics = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { classroom, isTeacher } = await ensureClassroomAccess(classId, req.user._id);

    if (!isTeacher) {
        throw new ApiError(403, "Only teachers can access classroom analytics");
    }

    const assignments = await Assignment.find({ classroom: classId }).select("_id");
    const assignmentIds = assignments.map((assignment) => assignment._id);

    const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
        .select("grade");
    const gradedSubmissions = submissions.filter((submission) => submission.grade !== null);
    const averageGrade = calculateAverage(gradedSubmissions.map((submission) => submission.grade));

    const lectures = await Lecture.find({ classroom: classId }).select("_id");
    const lectureIds = lectures.map((lecture) => lecture._id);

    const attendanceRecords = await LectureAttendance.find({ lecture: { $in: lectureIds } })
        .select("durationSeconds");
    const averageAttendanceDuration = calculateAverage(attendanceRecords.map((record) => record.durationSeconds || 0));

    const exams = await Exam.find({ classroom: classId }).select("_id");
    const examIds = exams.map((exam) => exam._id);

    const examAttempts = await ExamAttempt.find({
        exam: { $in: examIds },
        status: "submitted",
        score: { $ne: null },
    }).select("score");

    const averageExamScore = calculateAverage(examAttempts.map((attempt) => attempt.score || 0));

    return res.status(200).json(new ApiResponse(200, {
        totalStudents: classroom.students?.length || 0,
        totalAssignments: assignments.length,
        totalSubmissions: submissions.length,
        averageGrade,
        totalLectures: lectures.length,
        averageAttendanceDuration,
        totalExams: exams.length,
        totalExamAttempts: examAttempts.length,
        averageExamScore,
    }, "Teacher analytics fetched"));
});

const getStudentAnalytics = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { classroom } = await ensureClassroomAccess(classId, req.user._id);

    const assignments = await Assignment.find({ classroom: classId }).select("_id");
    const assignmentIds = assignments.map((assignment) => assignment._id);

    const submissions = await Submission.find({
        assignment: { $in: assignmentIds },
        student: req.user._id,
    }).select("grade");

    const gradedSubmissions = submissions.filter((submission) => submission.grade !== null);
    const averageGrade = calculateAverage(gradedSubmissions.map((submission) => submission.grade));

    const lectures = await Lecture.find({ classroom: classId }).select("_id");
    const lectureIds = lectures.map((lecture) => lecture._id);

    const attendanceRecords = await LectureAttendance.find({
        lecture: { $in: lectureIds },
        student: req.user._id,
    }).select("durationSeconds");

    const totalAttendanceDuration = attendanceRecords.reduce(
        (sum, record) => sum + (record.durationSeconds || 0),
        0
    );

    const averageAttendanceDuration = attendanceRecords.length
        ? Math.round(totalAttendanceDuration / attendanceRecords.length)
        : null;

    const exams = await Exam.find({ classroom: classId }).select("_id");
    const examIds = exams.map((exam) => exam._id);

    const examAttempts = await ExamAttempt.find({
        exam: { $in: examIds },
        student: req.user._id,
        status: "submitted",
        score: { $ne: null },
    }).select("score");

    const averageExamScore = calculateAverage(examAttempts.map((attempt) => attempt.score || 0));

    return res.status(200).json(new ApiResponse(200, {
        totalAssignments: assignments.length,
        totalSubmissions: submissions.length,
        averageGrade,
        totalLectures: lectures.length,
        totalAttendanceSessions: attendanceRecords.length,
        averageAttendanceDuration,
        totalExams: exams.length,
        totalExamAttempts: examAttempts.length,
        averageExamScore,
    }, "Student analytics fetched"));
});

export {
    getTeacherAnalytics,
    getStudentAnalytics,
};
