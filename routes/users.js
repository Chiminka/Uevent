import { Router } from "express";
import { UserController } from "../controllers/users.js";
import { verifyJWT } from "../utils/checkAuth.js";

const userController = new UserController();

const router = new Router();
router.use(verifyJWT);

// Get my events if it's a company +
// http://localhost:3002/api/users/events
router.get("/events", userController.getMyEvents);

// Get my tickets if it's a user +
// http://localhost:3002/api/users/tickets
router.get("/tickets", userController.getMyTickets);

//Show all company's events, limit in 5 +
// http://localhost:3002/api/users/:id/events
router.get("/:id/events", userController.getCompanyEvents);

// Delete user by id +
// http://localhost:3002/api/users/:id
router.delete("/:id", userController.deleteUser);

// Update user by id +
// http://localhost:3002/api/users/:id
router.patch("/:id", userController.updateUser);

export default router;
