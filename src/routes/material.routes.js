import express from "express";
const materialRouter = express.Router();
import {
    createMaterial,
    deleteMaterial,
    getMaterial,
    getMaterials,
    updateMaterial
} from "../controllers/material.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

materialRouter.use(verifyJWT);

materialRouter.route("/create-material").post(createMaterial);
materialRouter.route("/get-material/:id").get(getMaterial);
materialRouter.route("/get-all-material/:id").get(getMaterials);
materialRouter.route("/delete-material/:materialId").delete(deleteMaterial);
materialRouter.route("/update-material/:id").patch(updateMaterial);

export default materialRouter;

