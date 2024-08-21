import express from "express"
const classRouter = express.Router();
import {
    createClassroom,
    deleteClassroom,
    getAllClassrooms,
    getClassroomById, 
    joinClassroom, 
    updateClassroom, 
    leaveClassroom
} from "../controllers/class.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

classRouter.use(verifyJWT);

classRouter.route('/create-classroom').post(createClassroom);
classRouter.route('/delete-classroom/:id').delete(deleteClassroom);
classRouter.route('/get-all-classrooms').get(getAllClassrooms); 
classRouter.route('/get-classroom/:id').get(getClassroomById);
classRouter.route('/update-classroom-info/:id').patch(updateClassroom);
classRouter.route('/join-classroom/:id').patch(joinClassroom);
classRouter.route('/leave-classroom/:id').patch(leaveClassroom);

export default classRouter;
