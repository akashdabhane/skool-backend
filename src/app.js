import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import morgan from "morgan";

const app = express();

// log requests
app.use(morgan('tiny'));

// cross origin requests
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
}));

app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


// import/load routers
import userRouter from "./routes/user.routes.js";
import classroomRouter from "./routes/classroom.routes.js";
import assignmentRouter from "./routes/assignment.routes.js";
import submissionRouter from "./routes/submission.routes.js";
import commentRouter from "./routes/comment.routes.js";
import materialRouter from "./routes/material.routes.js";
import announcementRouter from "./routes/announcement.routes.js";
import questionRouter from "./routes/question.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/class", classroomRouter);
app.use("/api/v1/assignments", assignmentRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/materials", materialRouter);
app.use("/api/v1/announcements", announcementRouter);
app.use("/api/v1/questions", questionRouter);

export { app }