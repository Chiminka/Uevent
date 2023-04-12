import { Router } from "express";
import { UserController } from "../controllers/users.js";
import { verifyJWT } from "../utils/checkAuth.js";

const userController = new UserController();

const router = new Router();

// Get my tickets if it's a user +
// http://localhost:3002/api/users/tickets
router.get("/tickets", verifyJWT, userController.getMyTickets);

// Get my companies +
// http://localhost:3002/api/users/companies
router.get("/companies", verifyJWT, userController.getMyCompanies);

// Load my profile pic +
// http://localhost:3002/api/users/:id/pic-load
router.patch("/:id/pic-load", verifyJWT, userController.loadProfilePhoto);

// Delete user by id +
// http://localhost:3002/api/users/:id
router.delete("/:id", verifyJWT, userController.deleteUser);

// Update user by id +
// http://localhost:3002/api/users/:id
router.patch("/:id", verifyJWT, userController.updateUser);

// Make a subscription to a company or event and its changes +
// http://localhost:3002/api/users/subscriptionTo/:id
router.get("/subscriptionTo/:id", verifyJWT, userController.subscriptionTo);

// Update user's subs by id +
// http://localhost:3002/api/users/:id/subs
router.patch("/:id/subs", verifyJWT, userController.updateMySubs);

export default router;
