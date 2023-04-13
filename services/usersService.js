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
  const user = await User.findById(req.user.id);
  const userID = req.user.id;

  if (req.user._id.equals(user._id)) {
    await User.findByIdAndDelete(req.user.id);
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
  await user.save();
  return user;
};
const updateMySubs = async (req) => {
  const { subscriptions_companies, subscriptions_events } = req.body;

  const user = await User.findById(req.user.id);

  console.log(subscriptions_companies);

  if (subscriptions_companies !== undefined)
    user.subscriptions_companies = subscriptions_companies;

  if (subscriptions_events !== undefined)
    user.subscriptions_events = subscriptions_events;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, user, {
    new: true,
  })
    .populate("subscriptions_companies")
    .populate("subscriptions_events");

  return updatedUser;
};
const updateUser = async (req, res) => {
  const {
    full_name,
    username,
    password,
    oldPassword,
    email,
    companies,
    my_social_net,
  } = req.body;
  const user = await User.findById(req.user.id);

  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordCorrect) {
    return { success: false, message: "Uncorrect password" };
  }

  if (req.user._id.equals(user._id)) {
    if (full_name && full_name !== user.full_name) user.full_name = full_name;

    if (username && username !== user.username) {
      user.username = username;
      if (!username.match(/^[a-zA-Z0-9._]*$/)) {
        return {
          message: "Username isn't valid",
        };
      }
    }

    if (
      companies &&
      JSON.stringify(companies) !== JSON.stringify(user.companies)
    ) {
      user.companies = companies;
    }

    if (
      my_social_net &&
      JSON.stringify(my_social_net) !== JSON.stringify(user.social_net)
    ) {
      user.social_net = my_social_net;
    }

    if (password) {
      const theSamePassword = await bcrypt.compare(password, user.password);
      if (!theSamePassword) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        user.password = hash;
      }
    }

    if (email && email !== user.email) {
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

      const accessToken = jwt.sign(
        {
          UserInfo: {
            email: user.email,
          },
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { email: user.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // Create secure cookie with refresh token
      res.cookie("jwt", refreshToken, {
        httpOnly: true, //accessible only by web server
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
      });
      // Create secure cookie with refresh token
      res.cookie("accessToken", accessToken, {
        httpOnly: true, //accessible only by web server
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
      });

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
    return { message: "User was updated" };
  } else return { message: "No access!" };
};
const subscriptionTo = async (req) => {
  const user = await User.findById(req.user.id)
    .populate("subscriptions_events")
    .populate("subscriptions_companies");

  if (
    (await Event.findById(req.params.id)) &&
    !user.subscriptions_events.some((event) => event._id.equals(req.params.id))
  ) {
    const event = await Event.findById(req.params.id);
    user.subscriptions_events.push(event);
  } else if (
    (await Company.findById(req.params.id)) &&
    !user.subscriptions_companies.some((company) =>
      company._id.equals(req.params.id)
    )
  ) {
    const company = await Company.findById(req.params.id);
    user.subscriptions_companies.push(company);
  }

  await user.save();
  return user;
};

export default {
  getMyTickets,
  deleteUser,
  updateUser,
  updateMySubs,
  subscriptionTo,
  getMyCompanies,
  loadProfilePhoto,
};
