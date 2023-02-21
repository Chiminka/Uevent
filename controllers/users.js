import userService from "../services/usersService.js";

export class UserController {
  async getMyEvents(req, res) {
    try {
      const getMyEvents = await userService.getMyEvents(req);
      res.json(getMyEvents);
    } catch (error) {
      res.json({ message: "Getting events error" });
    }
  }
  async getMyTickets(req, res) {
    try {
      const getMyTickets = await userService.getMyTickets(req);
      res.json(getMyTickets);
    } catch (error) {
      console.log(error);
      res.json({ message: "Getting tickets error" });
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
      const updateUser = await userService.updateUser(req);
      res.json(updateUser);
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating user error" });
    }
  }
  async getCompanyEvents(req, res) {
    try {
      const getCompanyEvents = await userService.getCompanyEvents(req);
      res.json(getCompanyEvents);
    } catch (error) {
      res.json({ message: "Getting events error" });
    }
  }
}
