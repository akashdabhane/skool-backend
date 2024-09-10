import express from "express";
const questionRouter = express.Router();
import {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionById,
    getAllQuestionsOfClassroom,
} from "../controllers/question.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

questionRouter.use(verifyJWT);

questionRouter.route("/create-question").post(upload.fields(["video", "document"]), createQuestion);
questionRouter.route("/update-question/:id").patch(updateQuestion);
questionRouter.route("/delete-question/:id").delete(deleteQuestion);
questionRouter.route("/get-question/:id").get(getQuestionById);
questionRouter.route("/get-all-questions/:classroomId").get(getAllQuestionsOfClassroom);

export default questionRouter;