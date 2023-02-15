import { Router } from "express";
import { AuthController } from "../controllers/auth.js";
import { verifyJWT } from "../utils/checkAuth.js";

const authController = new AuthController();

const router = new Router();

// Register +
// http://localhost:3002/api/auth/register
router.post("/register", authController.register);

// Login +
// http://localhost:3002/api/auth/login
router.post("/login", authController.login);

// Log out +
// http://localhost:3002/api/auth/logout
router.get("/logout", authController.logout);

// Forgot password +
// http://localhost:3002/api/auth/recover
router.post("/recover", authController.forgotPassword);

// Recover password +
// http://localhost:3002/api/auth/recover/:token
router.post("/recover/:token", authController.reset);

// Get Me +
// http://localhost:3002/api/auth/me
router.get("/me", verifyJWT, authController.getMe);

// Verify email +
// http://localhost:3002/api/users/verify/:token
router.get("/verify/:token", authController.verifyEmail);

export default router;
