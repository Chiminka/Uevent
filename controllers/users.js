import User from "../models/User.js";
import Event from "../models/Event.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailTransport from "../utils/mailTransport.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

export class UserController {
  async getMyEvents(req, res) {
    try {
      // получить все ивенты, где ты автор
      const user = await User.findById(req.user.id);
      const userId = user.id;

      const events = await Event.find({ author: { _id: userId } }).sort(
        "-date_event"
      );
      res.json(events);
    } catch (error) {
      res.json({ message: "Getting events error" });
    }
  }
  async getMyTickets(req, res) {
    try {
      // получить все приобретенные билеты
      const user = await User.findById(req.user.id);
      const userId = user.id;

      const tickets = await Event.find().sort("-date_event");
      let mas = [];
      for (let i = 0; i < tickets.length; i++) {
        for (let j = 0; j < tickets[i].members.length; j++)
          if (tickets[i].members[j] == userId) mas.push(tickets[i]);
      }
      res.json(mas);
    } catch (error) {
      console.log(error);
      res.json({ message: "Getting tickets error" });
    }
  }
  async deleteUser(req, res) {
    try {
      const user = await User.findById(req.params.id);

      if (req.user._id.equals(user._id)) {
        await User.findByIdAndDelete(req.params.id);
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.sendStatus(204); //No content
        res.clearCookie("jwt", {
          httpOnly: true,
        });
        res.clearCookie("accessToken", {
          httpOnly: true,
        });
        res.json({ message: "Cookie were cleared, user was deleted" });
      } else return res.json({ message: "No access!" });
    } catch (error) {
      console.log(error);
      res.json({ message: "Deleting user error" });
    }
  }
  async updateUser(req, res) {
    try {
      const { full_name, username, password, email } = req.body;
      const user = await User.findById(req.params.id);

      if (req.user._id.equals(user._id)) {
        if (req.files) {
          let fileName = Date.now().toString() + req.files.image.name;
          const __dirname = dirname(fileURLToPath(import.meta.url));
          req.files.image.mv(path.join(__dirname, "..", "uploads", fileName));
        }

        if (fileName.length < 1) {
          fileName = user.avatar;
        }
        user.avatar = fileName;
        user.full_name = full_name;
        if (username) {
          user.username = username;
          if (!username.match(/^[a-zA-Z0-9._]*$/)) {
            return res.json({
              message: "Username isn't valid",
            });
          }
        }
        if (password) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(password, salt);
          user.password = hash;
        }
        if (email) {
          var validRegex =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

          if (!email.match(validRegex)) {
            return res.json({
              message: "Email isn't valid",
            });
          }
          user.email = email;
          user.verified = false;
          const v_token = jwt.sign(
            {
              email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
          );

          // verification email
          const url = `${process.env.BASE_URL}verify/${v_token}`;
          mailTransport().sendMail({
            from: process.env.USER,
            to: user.email,
            subject: "Verify your email account",
            html: `<h1>${url}</h1>`,
          });
          await user.save();
          return res.json({
            user,
            message: "An Email sent to your account please verify",
          });
        }
        await user.save();
        res.json(user);
      } else return res.json({ message: "No access!" });
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating user error" });
    }
  }
  async getCompanyEvents(req, res) {
    try {
      // получить все ивенты компании
      const user = await User.findById(req.params.id);
      const userId = user.id;
      const events = await Event.find({ author: { _id: userId } })
        .sort("-date_event")
        .limit(5);
      res.json(events);
    } catch (error) {
      res.json({ message: "Getting events error" });
    }
  }
}
