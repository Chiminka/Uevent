import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailTransport from "../utils/mailTransport.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import Ticket from "../models/Ticket.js";
import Company from "../models/Company.js";
import fs from "fs";
import util from "util";
import Event from "../models/Event.js";

const mkdir = util.promisify(fs.mkdir);

const getMyTickets = async (req) => {
  // получить все приобретенные билеты
  const tickets = await Ticket.find().populate({
    path: "event",
    populate: [{ path: "themes" }, { path: "formats" }],
  });
  let mas = [];
  for (let i = 0; i < tickets.length; i++) {
    if (tickets[i].user.toString() === req.user._id.toString()) {
      mas.push(tickets[i]);
    }
  }
  return mas;
};
const getMyCompanies = async (req) => {
  // получить все компании
  const user = await User.findById(req.user.id);
  let mas = [];
  for (let i = 0; i < user.companies.length; i++) {
    let myCompanies = await Company.findById(user.companies[i]);
    mas.push(myCompanies);
  }
  return mas;
};
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  const userID = req.params.id;

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
    const tickets = await Ticket.find({ user: userID });
    for (let i = 0; i < tickets.length; i++) {
      await Ticket.findOneAndDelete({ user: tickets[i].user });
    }
    return { message: "Cookie were cleared, user was deleted" };
  } else return { message: "No access!" };
};
const loadProfilePhoto = async (req) => {
  const user = await User.findById(req.params.id);
  let fileName = "";
  if (req.files) {
    fileName = Date.now().toString() + req.files.files.name;
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const uploadDir = path.join(__dirname, "..", "uploads");
    try {
      await mkdir(uploadDir);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }
    req.files.files.mv(path.join(uploadDir, fileName));
  }

  if (fileName.length < 1) {
    fileName = user.avatar;
  }
  user.avatar = fileName;
  user.save();
  return user;
};
const updateUser = async (req) => {
  const { full_name, username, password, email, companies, my_social_net } =
    req.body;
  const user = await User.findById(req.params.id);

  if (req.user._id.equals(user._id)) {
    user.full_name = full_name;
    if (username) {
      user.username = username;
      if (!username.match(/^[a-zA-Z0-9._]*$/)) {
        return {
          message: "Username isn't valid",
        };
      }
    }
    if (companies) user.companies = companies;
    if (my_social_net) user.social_net = my_social_net;
    console.log(my_social_net);
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
const subscriptionUser = async (req) => {
  const user = await User.findById(req.user.id);
  if (
    (await Event.findById(req.params.id)) &&
    !user.subscriptions_events.includes(req.params.id)
  ) {
    user.subscriptions_events.push(req.params.id);
    user.save();
  } else if (
    (await Company.findById(req.params.id)) &&
    !user.subscriptions_companies.includes(req.params.id)
  ) {
    user.subscriptions_companies.push(req.params.id);
    user.save();
  }
  return user;
};

export default {
  getMyTickets,
  deleteUser,
  updateUser,
  subscriptionUser,
  getMyCompanies,
  loadProfilePhoto,
};
