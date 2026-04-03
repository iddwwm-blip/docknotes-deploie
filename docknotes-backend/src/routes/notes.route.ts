import express from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import * as noteController from "@/controllers/note.controller";

const router: express.Router = express.Router();

router.use(authMiddleware);

router.get("/", noteController.getAll);
router.get("/:id", noteController.getById);
router.post("/", noteController.create);
router.put("/:id", noteController.update);
router.patch("/:id", noteController.patch);
router.delete("/:id", noteController.remove)

export default router