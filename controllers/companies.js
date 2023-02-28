import companyService from "../services/companyService.js";

export class CompanyController {
  async deleteCompany(req, res) {
    try {
      const deleteCompany = await companyService.deleteCompany(req, res);
      res.json(deleteCompany);
    } catch (error) {
      console.log(error);
      res.json({ message: "Deleting user error" });
    }
  }
  async updateCompany(req, res) {
    try {
      const updateCompany = await companyService.updateCompany(req);
      res.json(updateCompany);
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating user error" });
    }
  }
  async getCompanyEvents(req, res) {
    try {
      const getCompanyEvents = await companyService.getCompanyEvents(req);
      res.json(getCompanyEvents);
    } catch (error) {
      res.json({ message: "Getting events error" });
    }
  }
  async createMyCompany(req, res) {
    try {
      const createMyCompany = await companyService.createMyCompany(req);
      res.json(createMyCompany);
    } catch (error) {
      console.log(error);
      res.json({ message: "Creating company error" });
    }
  }
  async getCompanyById(req, res) {
    try {
      const getCompanyById = await companyService.getCompanyById(req);
      res.json(getCompanyById);
    } catch (error) {
      res.json({ message: "Getting events error" });
    }
  }
}
