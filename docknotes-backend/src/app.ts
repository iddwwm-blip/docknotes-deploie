import express, { type Express, Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth";
import categoriesRouter from "@/routes/categories.route";
import notesRouter from "@/routes/notes.route";
import contactRouter from "@/routes/contact.route";
import imagesRouter from "@/routes/images.route";

const app: Express = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Better Auth handler BEFORE express.json()
app.all("/api/auth/{*splat}", toNodeHandler(auth));

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to Docknote API" });
});

// Routes
app.use("/categories", categoriesRouter);
app.use("/notes", notesRouter);
app.use("/contact", contactRouter);
app.use("/images", imagesRouter);

export default app;