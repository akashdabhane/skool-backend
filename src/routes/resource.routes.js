import express from "express";
import {
    createResource,
    getResourcesByClassroom,
    updateResource,
    deleteResource,
} from "../controllers/resource.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const resourceRouter = express.Router();

resourceRouter.use(verifyJWT);

resourceRouter.route("/create").post(upload.single("file"), createResource);
resourceRouter.route("/classroom/:classId").get(getResourcesByClassroom);
resourceRouter.route("/:id").patch(upload.single("file"), updateResource);
resourceRouter.route("/:id").delete(deleteResource);

export default resourceRouter;
