import express from "express";
import { signInAdmin, signOutAdmin } from "../controllers/adminAuth.controllers.js";

const adminAuthRouter = express.Router();
adminAuthRouter.post("/signin", signInAdmin);
adminAuthRouter.post("/signout", signOutAdmin);

export default adminAuthRouter;
