import { Exam, ExamAttempt } from "../models/exam.model.js";
import { ExamProctorSession } from "../models/examProctorSession.model.js";
import { ExamFlag } from "../models/examFlag.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateMcqScore } from "../utils/examScoring.js";

const getSeverityWeight = (severity) => {
    if (severity === "high") return 3;
    if (severity === "medium") return 2;
    return 1;
};

const ensureActiveAttempt = async (examId, studentId) => {
    const attempt = await ExamAttempt.findOne({ exam: examId, student: studentId });
    if (!attempt) {
        throw new ApiError(404, "Attempt not found");
    }
    if (attempt.status !== "in-progress") {
        throw new ApiError(400, "Attempt is not active");
    }
    return attempt;
};

const terminateAttempt = async ({ exam, attempt, reason }) => {
    if (attempt.status === "submitted") {
        return attempt;
    }

    const mcqScore = await calculateMcqScore(exam._id, attempt.answers || {});
    const now = new Date();

    attempt.mcqScore = mcqScore;
    attempt.subjectiveScore = attempt.subjectiveScore || 0;
    attempt.score = mcqScore + (attempt.subjectiveScore || 0);
    attempt.status = "submitted";
    attempt.submittedAt = now;
    attempt.terminatedAt = now;
    attempt.terminationReason = reason;
    await attempt.save();

    return attempt;
};

const startProctorSession = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (req.user?.isTeacher) {
        throw new ApiError(403, "Only students can start proctoring");
    }

    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    if (!exam.proctoringEnabled) {
        return res.status(200).json(new ApiResponse(200, null, "Proctoring not enabled"));
    }

    const attempt = await ensureActiveAttempt(id, req.user._id);

    let session = await ExamProctorSession.findOne({ exam: id, attempt: attempt._id });
    if (!session) {
        session = await ExamProctorSession.create({
            exam: id,
            attempt: attempt._id,
            student: req.user._id,
            startedAt: new Date(),
            status: "active",
        });
    }

    return res.status(200).json(new ApiResponse(200, session, "Proctor session started"));
});

const createProctorFlag = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, severity, metadata } = req.body;

    if (req.user?.isTeacher) {
        throw new ApiError(403, "Only students can submit flags");
    }

    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    if (!exam.proctoringEnabled) {
        return res.status(200).json(new ApiResponse(200, null, "Proctoring not enabled"));
    }

    const attempt = await ensureActiveAttempt(id, req.user._id);

    const flag = await ExamFlag.create({
        exam: id,
        attempt: attempt._id,
        student: req.user._id,
        type: type || "unknown",
        severity: severity || "low",
        metadata: metadata || {},
    });

    let session = await ExamProctorSession.findOne({ exam: id, attempt: attempt._id });
    if (!session) {
        session = await ExamProctorSession.create({
            exam: id,
            attempt: attempt._id,
            student: req.user._id,
            startedAt: new Date(),
            status: "active",
        });
    }

    session.totalViolations += 1;
    if (flag.type === "tab-switch" || flag.type === "visibility-change") {
        session.tabSwitchCount += 1;
    }
    if (flag.type === "copy-paste") {
        session.copyPasteCount += 1;
    }
    session.riskScore += getSeverityWeight(flag.severity);
    session.lastFlagAt = new Date();

    let terminated = false;
    if (exam.autoTerminate) {
        const reachedViolations = session.totalViolations >= exam.maxViolations;
        const reachedTabSwitches = session.tabSwitchCount >= exam.maxTabSwitches;
        const reachedCopyPaste = session.copyPasteCount >= exam.maxCopyPaste;
        const reachedRisk = session.riskScore >= exam.riskScoreThreshold;

        if (reachedViolations || reachedTabSwitches || reachedCopyPaste || reachedRisk) {
            terminated = true;
            const reason = reachedRisk
                ? "risk-threshold"
                : reachedCopyPaste
                    ? "copy-paste-limit"
                    : reachedTabSwitches
                        ? "tab-switch-limit"
                        : "violation-limit";
            await terminateAttempt({ exam, attempt, reason });
            session.status = "terminated";
            session.endedAt = new Date();
        }
    }

    await session.save();
    const refreshedAttempt = await ExamAttempt.findById(attempt._id);

    return res.status(200).json(new ApiResponse(200, {
        flag,
        session,
        attempt: refreshedAttempt,
        terminated,
    }, "Flag recorded"));
});

const getProctorFlags = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const exam = await Exam.findById(id);
    if (!exam) throw new ApiError(404, "Exam not found");

    if (!exam.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized");
    }

    const flags = await ExamFlag.find({ exam: id })
        .populate("student", "firstname lastname email")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, flags, "Flags fetched"));
});

export {
    startProctorSession,
    createProctorFlag,
    getProctorFlags,
};
