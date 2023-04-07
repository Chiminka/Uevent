import userService from "../services/usersService.js";

export class UserController {
  async getMyTickets(req, res) {
    try {
      const getMyTickets = await userService.getMyTickets(req);
      res.json(getMyTickets);
    } catch (error) {
      console.log(error);
      res.json({ message: "Getting tickets error" });
    }
  }
  async loadProfilePhoto(req, res) {
    try {
      const loadProfilePhoto = await userService.loadProfilePhoto(req);
      res.json(loadProfilePhoto);
    } catch (error) {
      console.log(error);
      res.json({ message: "Upload photo error" });
    }
  }
  async getMyCompanies(req, res) {
    try {
      const getMyCompanies = await userService.getMyCompanies(req);
      res.json(getMyCompanies);
    } catch (error) {
      console.log(error);
      res.json({ message: "Getting companies error" });
    }
  }
  async deleteUser(req, res) {
    try {
      const deleteUser = await userService.deleteUser(req, res);
      res.json(deleteUser);
    } catch (error) {
      console.log(error);
      res.json({ message: "Deleting user error" });
    }
  }
  async updateUser(req, res) {
    try {
      const updateUser = await userService.updateUser(req, res);
      res.json(updateUser);
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating user error" });
    }
  }
  async subscriptionUser(req, res) {
    try {
      const subscriptionUser = await userService.subscriptionUser(req);
      res.json(subscriptionUser);
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating user error" });
    }
  }
}
