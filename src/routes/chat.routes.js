import express from "express";
import { createRoom, getRoomsForClassroom, getMessagesByRoom } from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const chatRouter = express.Router();

chatRouter.use(verifyJWT);

chatRouter.route("/room").post(createRoom);
chatRouter.route("/room/:classId").get(getRoomsForClassroom);
chatRouter.route("/messages/:roomId").get(getMessagesByRoom);

export default chatRouter;
