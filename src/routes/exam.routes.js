import express from "express";
import {
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
} from "../controllers/exam.controller.js";
import {
    startProctorSession,
    createProctorFlag,
    getProctorFlags,
} from "../controllers/proctor.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const examRouter = express.Router();

examRouter.use(verifyJWT);

examRouter.route("/create").post(createExam);
examRouter.route("/publish/:id").patch(publishExam);
examRouter.route("/classroom/:classId").get(getExamsByClassroom);
examRouter.route("/:id").get(getExamById);
examRouter.route("/:id/start").post(startExam);
examRouter.route("/:id/autosave").patch(autosaveExam);
examRouter.route("/:id/submit").post(submitExam);
examRouter.route("/:id/my-attempt").get(getMyAttempt);
examRouter.route("/:id/result/:studentId").get(getExamResult);
examRouter.route("/:id/attempts").get(getExamAttempts);
examRouter.route("/:id/attempts/:attemptId/grade").patch(gradeExamAttempt);
examRouter.route("/:id/leaderboard").get(getExamLeaderboard);
examRouter.route("/:id/proctor/start").post(startProctorSession);
examRouter.route("/:id/proctor/flag").post(createProctorFlag);
examRouter.route("/:id/proctor/flags").get(getProctorFlags);

export default examRouter;
