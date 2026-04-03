import { Request, Response } from "express";
import * as imageService from "@/services/image.service";

/**
 * POST / — Upload une image.
 */
export async function upload(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Aucune image fournie" });
      return;
    }

    const image = await imageService.uploadImage(req.userId!, req.file.buffer);
    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
}

/**
 * GET / — Récupère toutes les images de l'utilisateur.
 */
export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const images = await imageService.getAllImages(req.userId!);
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
}

/**
 * DELETE /:id — Supprime une image.
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const result = await imageService.deleteImage(Number(req.params.id), req.userId!);
    if (!result) {
      res.status(404).json({ message: "Image not found" });
      return;
    }
    res.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Image not found" });
      return;
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
}
