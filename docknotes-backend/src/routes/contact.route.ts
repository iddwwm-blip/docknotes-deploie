import express from "express";
import * as contactController from "@/controllers/contact.controller";

const router: express.Router = express.Router();

router.post("/", contactController.send);

export default router;
