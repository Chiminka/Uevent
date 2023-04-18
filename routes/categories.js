import { Router } from "express";
import { CategoryController } from "../controllers/categories.js";
import { verifyJWT } from "../utils/checkAuth.js";

const categoryController = new CategoryController();

const router = new Router();

// Get all themes +
// http://localhost:3002/api/categories/themes
router.get("/themes", categoryController.allThemes);

// Get all formats +
// http://localhost:3002/api/categories/formats
router.get("/formats", categoryController.allFormats);

// Get by ID +
// http://localhost:3002/api/categories/:id
router.get("/:id", categoryController.byId);

// Get all categories +
// http://localhost:3002/api/categories
router.get("/", categoryController.allCategories);

// Get Category Events +
// http://localhost:3002/api/categories/:id/events
router.get("/:id/events", categoryController.categoryEvents);

export default router;
