import { Router } from "express";
import { EventController } from "../controllers/events.js";
import { verifyJWT, verifyUser } from "../utils/checkAuth.js";

const eventController = new EventController();

const router = new Router();

// Get event by id +
// http://localhost:3002/api/events/:id
router.get("/:id", verifyUser, eventController.getEventById);

// Upload a picture +
// http://localhost:3002/api/events/:id/pic-load
router.post("/:id/pic-load", verifyUser, eventController.loadPictures);

// Get all visible events +
// http://localhost:3002/api/events/:page/:sort
router.get("/:page/:sort", eventController.getAllEvents);

// Create new event +
// http://localhost:3002/api/events/company/:id
router.post("/company/:id", verifyJWT, eventController.createEvent);

// Delete event by id +
// http://localhost:3002/api/events/:eventId/company/:companyId
router.delete(
  "/:eventId/company/:companyId",
  verifyJWT,
  eventController.deleteEvent
);

// Update event by id +
// http://localhost:3002/api/events/:eventId/company/:companyId
router.patch(
  "/:eventId/company/:companyId",
  verifyJWT,
  eventController.updateEvent
);

// Send tickets on the mail, add to members after buying and get promo code +
// http://localhost:3002/checkout-success
router.post(
  "/checkout-success/:cartItems",
  verifyJWT,
  eventController.after_buying_action
);

// Payment ?
// http://localhost:3002/api/events/create-checkout-session
router.post("/create-checkout-session", verifyJWT, eventController.payment);

// Get Event Comments +
// http://localhost:3002/api/events/:id/comments
router.get("/:id/comments", eventController.getEventComments);

// Create Event Comment +
// http://localhost:3002/api/events/:id/comments
router.post("/:id/comments", verifyJWT, eventController.createComment);

// Get Event Categories +
// http://localhost:3002/api/events/:id/categories
router.get("/:id/categories", eventController.getEventCategory);

export default router;
