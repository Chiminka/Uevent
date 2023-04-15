import companyService from "../services/companyService.js";

export class CompanyController {
  async deleteCompany(req, res) {
    try {
      const deleteCompany = await companyService.deleteCompany(req, res);
      res.json(deleteCompany);
    } catch (error) {
      console.log(error);
      res.json({ message: "Deleting company error" });
    }
  }
  async updateCompany(req, res) {
    try {
      const updateCompany = await companyService.updateCompany(req, res);
      res.json(updateCompany);
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating company error" });
    }
  }
  async getCompanyEvents(req, res) {
    try {
      const getCompanyEvents = await companyService.getCompanyEvents(req, res);
      res.json(getCompanyEvents);
    } catch (error) {
      res.json({ message: "Getting events error" });
    }
  }
  async createMyCompany(req, res) {
    try {
      const createMyCompany = await companyService.createMyCompany(req, res);
      res.json(createMyCompany);
    } catch (error) {
      console.log(error);
      res.json({ message: "Creating company error" });
    }
  }
  async getCompanyById(req, res) {
    try {
      const getCompanyById = await companyService.getCompanyById(req, res);
      res.json(getCompanyById);
    } catch (error) {
      res.json({ message: "Getting events error" });
    }
  }
  async updatePromo(req, res) {
    try {
      const updatePromo = await companyService.updatePromo(req, res);
      res.json(updatePromo);
    } catch (error) {
      res.json({ message: "Update promo error" });
    }
  }
  async giveSubPromo(req, res) {
    try {
      const giveSubPromo = await companyService.giveSubPromo(req, res);
      res.json(giveSubPromo);
    } catch (error) {
      res.json({ message: "Give promo error" });
    }
  }
  async inviteMembers(req, res) {
    try {
      const inviteMembers = await companyService.inviteMembers(req, res);
      res.json(inviteMembers);
    } catch (error) {
      console.log(error);
      res.json({ message: "Inviting error" });
    }
  }
  async addNewMember(req, res) {
    try {
      const addNewMember = await companyService.addNewMember(req, res);
      res.json(addNewMember);
    } catch (error) {
      console.log(error);
      res.json({ message: "Adding members error" });
    }
  }
  async loadPictures(req, res) {
    try {
      const loadPictures = await companyService.loadPictures(req, res);
      res.json(loadPictures);
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating event error" });
    }
  }
  async getCompaniesUsers(req, res) {
    try {
      const getCompaniesUsers = await companyService.getCompaniesUsers(
        req,
        res
      );
      res.json(getCompaniesUsers);
    } catch (error) {
      console.log(error);
      res.json({ message: "Getting users error" });
    }
  }
}
