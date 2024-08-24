import express from "express";
const commentRouter = express.Router();
import {
    createComment, 
    getAllComments,
    deleteComment,
    updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

commentRouter.use(verifyJWT);

commentRouter.route("/create-comment").post(createComment);
commentRouter.route("/get-all-comments/:id").get(getAllComments);
commentRouter.route("/delete-comment/:commentId").delete(deleteComment);
commentRouter.route("/update-comment/:id").patch(updateComment);

export default commentRouter;
