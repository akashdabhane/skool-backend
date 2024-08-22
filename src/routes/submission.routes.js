import express from "express";
const submissionRouter = express.Router();
import {
    createSubmission,
    deleteSubmission,
    getAllSubmissions,
    getSubmission,
} from "../controllers/submission.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

submissionRouter.use(verifyJWT);

submissionRouter.route("/create-submission").post(upload.single("file"), createSubmission);
submissionRouter.route("/get-all-submissions/:id").get(getAllSubmissions);
submissionRouter.route("/get-submission/:id").get(getSubmission);
submissionRouter.route("/delete-submission/:id").delete(deleteSubmission);

export default submissionRouter;
