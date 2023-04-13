import { Router } from "express";
import { CompanyController } from "../controllers/companies.js";
import { verifyJWT } from "../utils/checkAuth.js";

const companiesController = new CompanyController();

const router = new Router();

// Create a company +
// http://localhost:3002/api/companies
router.post("/", verifyJWT, companiesController.createMyCompany);

// Get company by id +
// http://localhost:3002/api/companies/:id
router.get("/:id", verifyJWT, companiesController.getCompanyById);

//Show all company's events, limit in 5 +
// http://localhost:3002/api/companies/:id/events
router.get("/:id/events", companiesController.getCompanyEvents);

// Delete company by id +
// http://localhost:3002/api/companies/:id
router.delete("/:id", verifyJWT, companiesController.deleteCompany);

// Update company by id +
// http://localhost:3002/api/companies/:id
router.patch("/:id", verifyJWT, companiesController.updateCompany);

// Create a new promo +
// http://localhost:3002/api/companies/:id/update-promo
router.get("/:id/update-promo", verifyJWT, companiesController.updatePromo);

// Let 5 or less random people, who is subscribed, a companies promo -
// http://localhost:3002/api/companies/:id/give-promo
router.get("/:id/give-promo", verifyJWT, companiesController.giveSubPromo);

export default router;
