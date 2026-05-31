import { Exam, ExamQuestion, ExamAttempt } from "../models/exam.model.js";
import { Classroom } from "../models/classroom.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateMcqScore } from "../utils/examScoring.js";

const createExam = asyncHandler(async (req, res) => {
    const {
        classroom,
        title,
        description,
        durationMinutes,
        scheduleStart,
        scheduleEnd,
        questions,
        proctoringEnabled,
        autoTerminate,
        maxViolations,
        maxTabSwitches,
        maxCopyPaste,
        riskScoreThreshold,
    } = req.body;

    if (!req.user?.isTeacher) {
        throw new ApiError(403, "Only teachers can create exams");
    }

    if (!classroom || !title || !durationMinutes || !scheduleStart || !scheduleEnd) {
        throw new ApiError(400, "Required fields are missing");
    }

    const classroomExists = await Classroom.findById(classroom);
    if (!classroomExists) {
        throw new ApiError(404, "Classroom not found");
    }

    if (!classroomExists.teacher.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized");
    }

    const exam = await Exam.create({
        classroom,
        createdBy: req.user._id,
        title,
        description: description || "",
        durationMinutes,
        scheduleStart,
        scheduleEnd,
        totalMarks: 0,
        status: "draft",
        proctoringEnabled: Boolean(proctoringEnabled),
        autoTerminate: Boolean(autoTerminate) && Boolean(proctoringEnabled),
        maxViolations: Number(maxViolations) || 5,
        maxTabSwitches: Number(maxTabSwitches) || 3,
        maxCopyPaste: Number(maxCopyPaste) || 2,
        riskScoreThreshold: Number(riskScoreThreshold) || 10,
    });

    let totalMarks = 0;
    const createdQuestions = [];

    if (Array.isArray(questions) && questions.length) {
        for (const question of questions) {
            const created = await ExamQuestion.create({
                exam: exam._id,
                question: question.question,
                questionType: question.questionType,
                options: question.options || [],
                correctAnswer: question.correctAnswer || "",
                marks: question.marks || 1,
            });
            totalMarks += created.marks;
            createdQuestions.push(created);
        }
    }

    exam.totalMarks = totalMarks;
    await exam.save();

    return res.status(201).json(new ApiResponse(201, { exam, questions: createdQuestions }, "Exam created"));
});

const publishExam = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    if (!exam.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized");
    }

    exam.status = "published";
    await exam.save();

    return res.status(200).json(new ApiResponse(200, exam, "Exam published"));
});

const getExamsByClassroom = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const exams = await Exam.find({ classroom: classId }).sort({ scheduleStart: 1 });

    return res.status(200).json(new ApiResponse(200, exams, "Exams fetched"));
});

const getExamById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    const questions = await ExamQuestion.find({ exam: id });

    return res.status(200).json(new ApiResponse(200, { exam, questions }, "Exam fetched"));
});

const startExam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    if (exam.status !== "published") {
        throw new ApiError(400, "Exam is not published");
    }

    const now = new Date();
    if (now < new Date(exam.scheduleStart)) {
        throw new ApiError(400, "Exam has not started yet");
    }

    if (now > new Date(exam.scheduleEnd)) {
        throw new ApiError(400, "Exam window has ended");
    }

    const existingAttempt = await ExamAttempt.findOne({ exam: id, student: studentId });
    if (existingAttempt) {
        return res.status(200).json(new ApiResponse(200, existingAttempt, "Exam already started"));
    }

    const durationMs = Number(exam.durationMinutes) * 60 * 1000;
    const endsAt = new Date(Math.min(
        now.getTime() + durationMs,
        new Date(exam.scheduleEnd).getTime()
    ));

    const attempt = await ExamAttempt.create({
        exam: id,
        student: studentId,
        startedAt: now,
        endsAt,
        status: "in-progress"
    });

    return res.status(201).json(new ApiResponse(201, attempt, "Exam started"));
});

const autosaveExam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { answers } = req.body;
    const studentId = req.user._id;

    const attempt = await ExamAttempt.findOne({ exam: id, student: studentId, status: "in-progress" });
    if (!attempt) {
        throw new ApiError(404, "Attempt not found");
    }

    if (!attempt.endsAt) {
        const exam = await Exam.findById(id);
        if (exam) {
            const durationMs = Number(exam.durationMinutes) * 60 * 1000;
            const calculatedEnd = new Date(Math.min(
                new Date(attempt.startedAt).getTime() + durationMs,
                new Date(exam.scheduleEnd).getTime()
            ));
            attempt.endsAt = calculatedEnd;
        }
    }

    if (attempt.endsAt && new Date() > new Date(attempt.endsAt)) {
        throw new ApiError(400, "Exam time is over");
    }

    attempt.answers = answers || {};
    await attempt.save();

    return res.status(200).json(new ApiResponse(200, attempt, "Answers autosaved"));
});

const submitExam = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { answers } = req.body;
    const studentId = req.user._id;

    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    const attempt = await ExamAttempt.findOne({ exam: id, student: studentId });
    if (!attempt) {
        throw new ApiError(404, "Attempt not found");
    }
    if (!attempt.endsAt) {
        const durationMs = Number(exam.durationMinutes) * 60 * 1000;
        attempt.endsAt = new Date(Math.min(
            new Date(attempt.startedAt).getTime() + durationMs,
            new Date(exam.scheduleEnd).getTime()
        ));
    }

    if (attempt.status === "submitted") {
        return res.status(200).json(new ApiResponse(200, attempt, "Exam already submitted"));
    }

    const answerMap = answers || {};

    const mcqScore = await calculateMcqScore(id, answerMap);

    const now = new Date();
    attempt.answers = answerMap;
    attempt.submittedAt = now;
    attempt.mcqScore = mcqScore;
    attempt.subjectiveScore = attempt.subjectiveScore || 0;
    attempt.score = mcqScore + (attempt.subjectiveScore || 0);
    attempt.status = "submitted";
    if (attempt.endsAt && now > new Date(attempt.endsAt)) {
        attempt.terminationReason = "time-expired";
        attempt.terminatedAt = now;
    }

    await attempt.save();

    return res.status(200).json(new ApiResponse(200, attempt, "Exam submitted"));
});

const getMyAttempt = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const studentId = req.user._id;

    const attempt = await ExamAttempt.findOne({ exam: id, student: studentId });

    return res.status(200).json(new ApiResponse(200, attempt, "Attempt fetched"));
});

const getExamResult = asyncHandler(async (req, res) => {
    const { id, studentId } = req.params;

    const attempt = await ExamAttempt.findOne({ exam: id, student: studentId });

    return res.status(200).json(new ApiResponse(200, attempt, "Result fetched"));
});

const getExamAttempts = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    if (!exam.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized");
    }

    const attempts = await ExamAttempt.find({ exam: id })
        .populate("student", "firstname lastname email")
        .sort({ submittedAt: -1 });

    return res.status(200).json(new ApiResponse(200, attempts, "Attempts fetched"));
});

const gradeExamAttempt = asyncHandler(async (req, res) => {
    const { id, attemptId } = req.params;
    const { scores } = req.body;

    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    if (!exam.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized");
    }

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) throw new ApiError(404, "Attempt not found");

    if (attempt.status !== "submitted") {
        throw new ApiError(400, "Attempt is not submitted yet");
    }

    const questions = await ExamQuestion.find({ exam: id, questionType: "subjective" });
    const scoreMap = scores || {};
    let subjectiveScore = 0;

    questions.forEach((question) => {
        const key = String(question._id);
        const rawScore = Number(scoreMap[key] || 0);
        const boundedScore = Math.max(0, Math.min(rawScore, question.marks));
        subjectiveScore += boundedScore;
        scoreMap[key] = boundedScore;
    });

    attempt.subjectiveScores = scoreMap;
    attempt.subjectiveScore = subjectiveScore;
    attempt.score = (attempt.mcqScore || 0) + subjectiveScore;
    attempt.gradedBy = req.user._id;
    attempt.gradedAt = new Date();
    await attempt.save();

    return res.status(200).json(new ApiResponse(200, attempt, "Attempt graded"));
});

const getExamLeaderboard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const limit = Number(req.query.limit || 10);

    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    if (!exam.createdBy.equals(req.user._id)) {
        const studentAttempt = await ExamAttempt.findOne({ exam: id, student: req.user._id, status: "submitted" });
        if (!studentAttempt) {
            throw new ApiError(403, "Unauthorized");
        }
    }

    const attempts = await ExamAttempt.find({ exam: id, status: "submitted" })
        .populate("student", "firstname lastname")
        .sort({ score: -1, submittedAt: 1 })
        .limit(limit);

    const leaderboard = attempts.map((attempt, index) => ({
        rank: index + 1,
        student: attempt.student,
        score: attempt.score,
        submittedAt: attempt.submittedAt,
    }));

    return res.status(200).json(new ApiResponse(200, leaderboard, "Leaderboard fetched"));
});

export {
    createExam,
    publishExam,
    getExamsByClassroom,
    getExamById,
    startExam,
    autosaveExam,
    submitExam,
    getMyAttempt,
    getExamResult,
    getExamAttempts,
    gradeExamAttempt,
    getExamLeaderboard,
};
