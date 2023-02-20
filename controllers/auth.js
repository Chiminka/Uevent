import { fileURLToPath } from "url";
import path, { dirname } from "path";

import authService from "../services/authService.js";

export class AuthController {
  async register(req, res) {
    try {
      if (req.files) {
        let fileName = Date.now().toString() + req.files.image.name;
        const __dirname = dirname(fileURLToPath(import.meta.url));
        req.files.image.mv(path.join(__dirname, "..", "uploads", fileName));
        const newUser = await authService.register(req.body, fileName);
        res.json(newUser);
      } else {
        const newUser = await authService.register(req.body, "");
        res.json(newUser);
      }
    } catch (error) {
      console.log(error);
      res.json({ message: "Creating user error" });
    }
  }
  async login(req, res) {
    try {
      const log_in_User = await authService.login(req.body, res);
      res.json(log_in_User);
    } catch (error) {
      console.log(error);
      return res.json({ message: "Autorization error" });
    }
  }
  async logout(req, res) {
    const log_out_User = await authService.logout(req.cookies, res);
    res.json(log_out_User);
  }
  async verifyEmail(req, res) {
    try {
      const verifyEmail = await authService.verifyEmail(req.params.token, req);
      res.json(verifyEmail);
    } catch (error) {
      console.log(error);
      return res.json({ message: "verify email error" });
    }
  }
  async getMe(req, res) {
    try {
      const getMe = await authService.getMe(req.user.id);
      res.json(getMe);
    } catch (error) {
      res.json({ message: "Not access" });
    }
  }
  async forgotPassword(req, res) {
    try {
      const forgotPassword = await authService.forgotPassword(req.body);
      res.json(forgotPassword);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  async reset(req, res) {
    try {
      const reset = await authService.reset(req.body, req.params.token, req);
      res.json(reset);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
