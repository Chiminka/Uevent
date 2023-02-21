import User from "../models/User.js";
import Event from "../models/Event.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailTransport from "../utils/mailTransport.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import Ticket from "../models/Ticket.js";

const getMyEvents = async (req) => {
  // получить все ивенты, где ты автор
  const user = await User.findById(req.user.id);
  const userId = user.id;

  const events = await Event.find({ author: { _id: userId } }).sort(
    "-date_event"
  );
  return events;
};
const getMyTickets = async (req) => {
  // получить все приобретенные билеты
  const tickets = await Ticket.find();
  let mas = [];
  for (let i = 0; i < tickets.length; i++) {
    if (tickets[i].user.toString() === req.user._id.toString()) {
      mas.push(tickets[i]);
    }
  }
  return mas;
};
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  const userID = req.params.id;

  if (req.user._id.equals(user._id)) {
    // await User.findByIdAndDelete(req.params.id);
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); //No content
    res.clearCookie("jwt", {
      httpOnly: true,
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
    });
    const tickets = await Ticket.find({ user: userID });
    for (let i = 0; i < tickets.length; i++) {
      await Ticket.findOneAndDelete({ user: tickets[i].user });
    }
    return { message: "Cookie were cleared, user was deleted" };
  } else return { message: "No access!" };
};
const updateUser = async (req) => {
  const { full_name, username, password, email } = req.body;
  const user = await User.findById(req.params.id);

  if (req.user._id.equals(user._id)) {
    let fileName = "";
    if (req.files) {
      fileName = Date.now().toString() + req.files.image.name;
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
        return {
          message: "Username isn't valid",
        };
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
        return {
          message: "Email isn't valid",
        };
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
      return {
        user,
        message: "An Email sent to your account please verify",
      };
    }
    await user.save();
    return user;
  } else return { message: "No access!" };
};
const getCompanyEvents = async (req) => {
  // получить все ивенты компании
  const user = await User.findById(req.params.id);
  if (user.role !== "company") return "It's not a company";
  const userId = user.id;
  const events = await Event.find({ author: { _id: userId } })
    .sort("-date_event")
    .limit(5);
  return events;
};

export default {
  getMyEvents,
  getMyTickets,
  deleteUser,
  updateUser,
  getCompanyEvents,
};
