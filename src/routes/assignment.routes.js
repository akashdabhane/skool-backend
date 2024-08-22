import express from "express";
const assignmentRouter = express.Router();
import {
    createAssignment,
    deleteAssignment,
    getAssignments,
    getAssignment,
    updateAssignment
} from "../controllers/assignment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

assignmentRouter.use(verifyJWT);

assignmentRouter.route("/create-assignment").post(createAssignment);
assignmentRouter.route("/delete-assignment/:id").delete(deleteAssignment);
assignmentRouter.route("/update-assignment/:id").patch(updateAssignment);
assignmentRouter.route("/get-all-assignments/:classroom").get(getAssignments);
assignmentRouter.route("/get-assignment/:id").get(getAssignment);

export default assignmentRouter;
