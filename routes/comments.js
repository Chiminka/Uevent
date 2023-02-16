import { Router } from "express";
import { CommentController } from "../controllers/comments.js";
import { verifyJWT } from "../utils/checkAuth.js";

const commentController = new CommentController();

const router = new Router();
router.use(verifyJWT);

// Get by ID +
// http://localhost:3002/api/comments/:id
router.get("/:id", commentController.byId);

// Update by id +
// http://localhost:3002/api/comments/:id
router.patch("/:id", commentController.UpdateComment);

// Remove Comment +
// http://localhost:3002/api/comments/:id
router.delete("/:id", commentController.removeComment);

export default router;
