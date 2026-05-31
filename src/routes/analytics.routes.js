import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getTeacherAnalytics, getStudentAnalytics } from "../controllers/analytics.controller.js";

const analyticsRouter = express.Router();

analyticsRouter.use(verifyJWT);

analyticsRouter.route("/teacher/:classId").get(getTeacherAnalytics);
analyticsRouter.route("/student/:classId").get(getStudentAnalytics);

export default analyticsRouter;
