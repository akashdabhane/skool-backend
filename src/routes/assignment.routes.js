import express from "express";
const assignmentRouter = express.Router();
import {
    createAssignment,
    deleteAssignment,
    getAssignments,
    getAssignment,
    updateAssignment,
    getAssignmentStats
} from "../controllers/assignment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

assignmentRouter.use(verifyJWT);

assignmentRouter.route("/create-assignment").post(upload.single("file"), createAssignment);
assignmentRouter.route("/delete-assignment/:id").delete(deleteAssignment);
assignmentRouter.route("/update-assignment/:id").patch(upload.single("file"), updateAssignment);
assignmentRouter.route("/get-all-assignments/:classroom").get(getAssignments);
assignmentRouter.route("/get-assignment/:id").get(getAssignment);
assignmentRouter.route("/get-assignment-stats/:id").get(getAssignmentStats);

export default assignmentRouter;
