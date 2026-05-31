import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Lecture } from "./models/lecture.model.js";
import { Classroom } from "./models/classroom.model.js";
import { LectureAttendance } from "./models/lectureAttendance.model.js";
import { Room } from "./models/room.model.js";
import { ChatMessage } from "./models/chatMessage.model.js";

let ioInstance = null;

const setupSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:3000", "https://bestskool.vercel.app"],
            credentials: true,
        },
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token
                || socket.handshake.headers?.authorization?.replace("Bearer ", "");

            if (!token) {
                return next(new Error("Unauthorized"));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            socket.data.userId = decoded._id;
            return next();
        } catch (error) {
            return next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(socket.data.userId.toString());
        socket.on("join-lecture", async ({ lectureId }) => {
            try {
                const lecture = await Lecture.findById(lectureId);
                if (!lecture) {
                    socket.emit("lecture-error", { message: "Lecture not found" });
                    return;
                }

                const classroom = await Classroom.findById(lecture.classroom);
                if (!classroom) {
                    socket.emit("lecture-error", { message: "Classroom not found" });
                    return;
                }

                const userId = socket.data.userId;
                const isStudent = classroom.students.includes(userId);
                const isTeacher = classroom.teacher.equals(userId);

                if (!isStudent && !isTeacher) {
                    socket.emit("lecture-error", { message: "Unauthorized" });
                    return;
                }

                socket.data.lectureId = lectureId;
                socket.join(lectureId);

                const existingAttendance = await LectureAttendance.findOne({
                    lecture: lectureId,
                    student: userId,
                    leftAt: null,
                });

                const attendance = existingAttendance || await LectureAttendance.create({
                    lecture: lectureId,
                    student: userId,
                    joinedAt: new Date(),
                });
                socket.data.attendanceId = attendance._id;

                const roomSockets = await io.in(lectureId).fetchSockets();
                const participants = roomSockets
                    .filter((roomSocket) => roomSocket.id !== socket.id)
                    .map((roomSocket) => ({
                        socketId: roomSocket.id,
                        userId: roomSocket.data.userId,
                    }));

                socket.emit("lecture-participants", { participants });
                socket.to(lectureId).emit("participant-joined", {
                    socketId: socket.id,
                    userId: socket.data.userId,
                });
            } catch (error) {
                socket.emit("lecture-error", { message: "Failed to join lecture" });
            }
        });

        socket.on("signal-offer", ({ to, offer }) => {
            socket.to(to).emit("signal-offer", { from: socket.id, offer });
        });

        socket.on("signal-answer", ({ to, answer }) => {
            socket.to(to).emit("signal-answer", { from: socket.id, answer });
        });

        socket.on("signal-ice", ({ to, candidate }) => {
            socket.to(to).emit("signal-ice", { from: socket.id, candidate });
        });

        socket.on("lecture-message", ({ lectureId, message }) => {
            socket.to(lectureId).emit("lecture-message", {
                from: socket.data.userId,
                message,
                at: new Date().toISOString(),
            });
        });

        socket.on("join-room", async ({ roomId }) => {
            const room = await Room.findById(roomId);
            if (!room || !room.members.includes(socket.data.userId)) {
                socket.emit("chat-error", { message: "Unauthorized" });
                return;
            }

            socket.join(roomId);
        });

        socket.on("leave-room", ({ roomId }) => {
            socket.leave(roomId);
        });

        socket.on("chat-message", async ({ roomId, message }) => {
            const room = await Room.findById(roomId);
            if (!room || !room.members.includes(socket.data.userId)) {
                socket.emit("chat-error", { message: "Unauthorized" });
                return;
            }

            const chatMessage = await ChatMessage.create({
                room: roomId,
                sender: socket.data.userId,
                message,
            });

            await Room.findByIdAndUpdate(roomId, { $set: { lastMessage: chatMessage._id } });

            io.to(roomId).emit("chat-message", {
                _id: chatMessage._id,
                room: roomId,
                sender: socket.data.userId,
                message: chatMessage.message,
                createdAt: chatMessage.createdAt,
            });
        });

        socket.on("typing", ({ roomId }) => {
            socket.to(roomId).emit("typing", { userId: socket.data.userId });
        });

        socket.on("stop-typing", ({ roomId }) => {
            socket.to(roomId).emit("stop-typing", { userId: socket.data.userId });
        });

        socket.on("message-read", async ({ messageId, roomId }) => {
            await ChatMessage.findByIdAndUpdate(messageId, { $set: { isRead: true } });
            socket.to(roomId).emit("message-read", { messageId });
        });

        socket.on("disconnect", async () => {
            const lectureId = socket.data.lectureId;
            if (lectureId) {
                socket.to(lectureId).emit("participant-left", {
                    socketId: socket.id,
                    userId: socket.data.userId,
                });
            }

            if (socket.data.attendanceId) {
                const leftAt = new Date();
                const attendance = await LectureAttendance.findById(socket.data.attendanceId);
                if (attendance && !attendance.leftAt) {
                    const durationSeconds = Math.max(
                        0,
                        Math.floor((leftAt.getTime() - attendance.joinedAt.getTime()) / 1000)
                    );

                    attendance.leftAt = leftAt;
                    attendance.durationSeconds = durationSeconds;
                    await attendance.save();
                }
            }
        });
    });

    ioInstance = io;
    return io;
};

const getSocket = () => ioInstance;

export { setupSocket, getSocket };
