import express from "express"
const classroomRouter = express.Router();
import {
    createClassroom,
    deleteClassroom,
    getAllClassrooms,
    getClassroomById, 
    joinClassroom, 
    updateClassroom, 
    leaveClassroom
} from "../controllers/classroom.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

classroomRouter.use(verifyJWT);

classroomRouter.route('/create-classroom').post(createClassroom);
classroomRouter.route('/delete-classroom/:id').delete(deleteClassroom);
classroomRouter.route('/get-all-classrooms').get(getAllClassrooms); 
classroomRouter.route('/get-classroom/:id').get(getClassroomById);
classroomRouter.route('/update-classroom-info/:id').patch(updateClassroom);
classroomRouter.route('/join-classroom/:id').patch(joinClassroom);
classroomRouter.route('/leave-classroom/:id').patch(leaveClassroom);

export default classroomRouter;
