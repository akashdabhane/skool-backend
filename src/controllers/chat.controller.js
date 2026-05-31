import { Room } from "../models/room.model.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import { Classroom } from "../models/classroom.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createRoom = asyncHandler(async (req, res) => {
    const { classroom, memberIds, isGroupChat, name, isClassroomRoom } = req.body;
    const userId = req.user._id;

    if (!classroom) {
        throw new ApiError(400, "classroom is required");
    }

    const classroomExists = await Classroom.findById(classroom);
    if (!classroomExists) {
        throw new ApiError(404, "Classroom not found");
    }

    const isTeacher = classroomExists.teacher.equals(userId);
    const isStudent = classroomExists.students.includes(userId);

    if (!isTeacher && !isStudent) {
        throw new ApiError(403, "You do not have permission to create chat rooms");
    }

    const members = Array.isArray(memberIds) ? memberIds : [];
    if (!members.includes(userId.toString())) {
        members.push(userId);
    }

    if (isClassroomRoom) {
        const existingRoom = await Room.findOne({ classroom, isClassroomRoom: true });
        if (existingRoom) {
            return res
                .status(200)
                .json(new ApiResponse(200, existingRoom, "Room already exists"));
        }
    }

    const room = await Room.create({
        classroom,
        members,
        isGroupChat: Boolean(isGroupChat),
        isClassroomRoom: Boolean(isClassroomRoom),
        name: name || (isClassroomRoom ? "Classroom chat" : "Direct chat"),
        admins: isGroupChat ? [userId] : [],
    });

    return res
        .status(201)
        .json(new ApiResponse(201, room, "Room created successfully"));
});

const getRoomsForClassroom = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const userId = req.user._id;

    const classroom = await Classroom.findById(classId);
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    const isTeacher = classroom.teacher.equals(userId);
    const isStudent = classroom.students.includes(userId);

    if (!isTeacher && !isStudent) {
        throw new ApiError(403, "You do not have permission to view rooms");
    }

    let classroomRoom = await Room.findOne({ classroom: classId, isClassroomRoom: true });
    if (!classroomRoom) {
        classroomRoom = await Room.create({
            classroom: classId,
            members: [classroom.teacher, ...classroom.students],
            isGroupChat: true,
            isClassroomRoom: true,
            name: "Classroom chat",
            admins: [classroom.teacher],
        });
    }

    const rooms = await Room.find({
        classroom: classId,
        members: userId,
    }).populate("lastMessage");

    return res
        .status(200)
        .json(new ApiResponse(200, rooms, "Rooms fetched successfully"));
});

const getMessagesByRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    if (!room.members.includes(userId)) {
        throw new ApiError(403, "You do not have permission to view messages");
    }

    const messages = await ChatMessage.find({ room: roomId }).sort({ createdAt: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

export {
    createRoom,
    getRoomsForClassroom,
    getMessagesByRoom,
};
