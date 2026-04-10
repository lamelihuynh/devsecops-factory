import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import {
    createGroup,
    getUserGroups,
} from "../controllers/group.controller.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

router.post("/create", createGroup);
router.get("/", getUserGroups);

export default router;
