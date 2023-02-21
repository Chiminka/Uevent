import { Router } from "express";
import { EventController } from "../controllers/events.js";
import { verifyJWT } from "../utils/checkAuth.js";

const eventController = new EventController();

const router = new Router();
router.use(verifyJWT);

// Get event by id +
// http://localhost:3002/api/events/:id
router.get("/:id", eventController.getEventById);

// Get all visible events +
// http://localhost:3002/api/events
router.get("/", eventController.getAllEvents);

// Create new event +
// http://localhost:3002/api/events
router.post("/", eventController.createEvent);

// Delete event by id +
// http://localhost:3002/api/events/:id
router.delete("/:id", eventController.deleteEvent);

// Update event by id +
// http://localhost:3002/api/events/:id
router.patch("/:id", eventController.updateEvent);

// Send tickets on the mail, add to members after buying and get promo code +
// http://localhost:3002/api/events/:id/after-the-payment
router.post("/:id/after-the-payment", eventController.after_buying_action);

// Payment ?
// http://localhost:3002/api/events/create-checkout-session
router.post("/create-checkout-session", eventController.payment);

// Get Event Comments +
// http://localhost:3002/api/events/:id/comments
router.get("/:id/comments", eventController.getEventComments);

// Create Event Comment +
// http://localhost:3002/api/events/:id/comments
router.post("/:id/comments", eventController.createComment);

// Get Event Categories +
// http://localhost:3002/api/events/:id/categories
router.get("/:id/categories", eventController.getEventCategory);

// //Show similar events to chosen event by category +
// // http://localhost:3002/api/events/:id/similar-events
// router.get("/:id/similar-events", eventController.getSimilarEvent);

//Get visible members of event +
// http://localhost:3002/api/events/:id/members
// router.get("/:id/members", eventController.getVisibleMembers);

export default router;
