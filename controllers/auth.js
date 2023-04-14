import authService from "../services/authService.js";

export class AuthController {
  async register(req, res) {
    try {
      const newUser = await authService.register(req, res);
      res.json(newUser);
    } catch (error) {
      console.log(error);
      res.json({ message: "Creating user error" });
    }
  }
  async login(req, res) {
    try {
      const log_in_User = await authService.login(req, res);
      res.json(log_in_User);
    } catch (error) {
      console.log(error);
      return res.json({ message: "Autorization error" });
    }
  }
  async logout(req, res) {
    const log_out_User = await authService.logout(req, res);
    res.json(log_out_User);
  }
  async verifyEmail(req, res) {
    try {
      const verifyEmail = await authService.verifyEmail(req, res);
      res.json(verifyEmail);
    } catch (error) {
      console.log(error);
      return res.json({ message: "verify email error" });
    }
  }
  async getMe(req, res) {
    try {
      const getMe = await authService.getMe(req, res);
      res.json(getMe);
    } catch (error) {
      res.json({ message: "Not access" });
    }
  }
  async forgotPassword(req, res) {
    try {
      const forgotPassword = await authService.forgotPassword(req, res);
      res.json(forgotPassword);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  async reset(req, res) {
    try {
      const reset = await authService.reset(req, res);
      res.json(reset);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
