import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import { authMiddleware } from "@/middlewares/auth.middleware";
import * as imageController from "@/controllers/image.controller";

const router: express.Router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées"));
    }
  },
});

router.use(authMiddleware);

router.post("/", upload.single("image"), imageController.upload);
router.get("/", imageController.getAll);
router.delete("/:id", imageController.remove);

// Error handler pour les erreurs multer
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: err.message });
    return;
  }
  if (err.message === "Seules les images sont autorisées") {
    res.status(400).json({ message: err.message });
    return;
  }
  res.status(500).json({ message: "Erreur serveur" });
});

export default router;