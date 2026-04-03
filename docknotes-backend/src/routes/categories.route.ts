import express from "express";
import * as categoryController from "@/controllers/category.controller";

const router: express.Router = express.Router();

router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getById);
router.post("/", categoryController.create);
router.put("/:id", categoryController.update);
router.patch("/:id", categoryController.patch);
router.delete("/:id", categoryController.remove);

export default router;
