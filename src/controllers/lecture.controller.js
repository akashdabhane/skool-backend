import { Lecture } from "../models/lecture.model.js";
import { Classroom } from "../models/classroom.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitNotificationToUsers } from "../utils/notificationEmitter.js";

const createLecture = asyncHandler(async (req, res) => {
    const {
        classroom,
        title,
        subject,
        topic,
        scheduleStart,
        scheduleEnd,
        duration,
        isRecurring,
        recurrenceRule,
    } = req.body;

    if (!req.user?.isTeacher) {
        throw new ApiError(403, "Only teachers can schedule lectures");
    }

    if ([classroom, title, subject, scheduleStart, scheduleEnd, duration].some((field) =>
        field === undefined || field === null || String(field).trim() === ""
    )) {
        throw new ApiError(400, "All fields are required");
    }

    const classroomExists = await Classroom.findById(classroom);
    if (!classroomExists) {
        throw new ApiError(404, "Classroom not found");
    }

    if (!classroomExists.teacher.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to schedule lectures for this classroom");
    }

    const startDate = new Date(scheduleStart);
    const endDate = new Date(scheduleEnd);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new ApiError(400, "Invalid schedule dates");
    }

    if (endDate <= startDate) {
        throw new ApiError(400, "Schedule end must be after start");
    }

    const lecture = await Lecture.create({
        classroom,
        teacher: req.user._id,
        title,
        subject,
        topic,
        scheduleStart: startDate,
        scheduleEnd: endDate,
        duration,
        status: "scheduled",
        isRecurring: Boolean(isRecurring),
        recurrenceRule: isRecurring ? recurrenceRule || "" : "",
    });

    await emitNotificationToUsers({
        userIds: [classroomExists.teacher, ...(classroomExists.students || [])],
        classroom: classroomExists._id,
        type: "lecture",
        message: `New lecture scheduled in ${classroomExists.classname}`,
        link: `/c/lec/${classroomExists._id}`
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, lecture, "Lecture scheduled successfully")
        );
});

const updateLecture = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lecture = await Lecture.findById(id);
    if (!lecture) {
        throw new ApiError(404, "Lecture not found");
    }

    if (!lecture.teacher.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to update this lecture");
    }

    const updatedLecture = await Lecture.findByIdAndUpdate(id,
        {
            $set: {
                title: req.body.title || lecture.title,
                subject: req.body.subject || lecture.subject,
                topic: req.body.topic || lecture.topic,
                scheduleStart: req.body.scheduleStart || lecture.scheduleStart,
                scheduleEnd: req.body.scheduleEnd || lecture.scheduleEnd,
                duration: req.body.duration || lecture.duration,
                status: req.body.status || lecture.status,
                isRecurring: req.body.isRecurring ?? lecture.isRecurring,
                recurrenceRule: req.body.isRecurring ? req.body.recurrenceRule || lecture.recurrenceRule : lecture.recurrenceRule,
            }
        },
        { new: true, runValidators: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedLecture, "Lecture updated successfully")
        );
});

const cancelLecture = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const lecture = await Lecture.findById(id);
    if (!lecture) {
        throw new ApiError(404, "Lecture not found");
    }

    if (!lecture.teacher.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to cancel this lecture");
    }

    lecture.status = "cancelled";
    lecture.cancelReason = cancelReason || "";
    await lecture.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, lecture, "Lecture cancelled successfully")
        );
});

const getLectureById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lecture = await Lecture.findById(id).populate("teacher");
    if (!lecture) {
        throw new ApiError(404, "Lecture not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, lecture, "Lecture fetched successfully")
        );
});

const getLecturesByClassroom = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const userId = req.user._id;

    const classroom = await Classroom.findById(classId);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    const isStudent = classroom.students.includes(userId);
    const isTeacher = classroom.teacher.equals(userId);

    if (!isStudent && !isTeacher) {
        throw new ApiError(403, "You do not have permission to view lectures");
    }

    const lectures = await Lecture.find({ classroom: classId }).sort({ scheduleStart: 1 });

    return res
        .status(200)
        .json(
            new ApiResponse(200, lectures, "Lectures fetched successfully")
        );
});

export {
    createLecture,
    updateLecture,
    cancelLecture,
    getLectureById,
    getLecturesByClassroom,
};
