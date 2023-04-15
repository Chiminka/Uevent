import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailTransport from "../utils/mailTransport.js";
import asyncHandler from "express-async-handler";
import Company from "../models/Company.js";

const register = async (req, res) => {
  const { username, full_name, password, email, repeatPassword } = req.body;

  if (!username || !password || !email || !repeatPassword)
    res.json({
      message: "Content can not be empty",
    });

  if (password === repeatPassword) {
    const usernameExist = await User.findOne({ username });
    const emailExist = await User.findOne({ email });
    console.log(usernameExist, emailExist);
    if (emailExist || usernameExist) {
      res.json({
        message: "These username or email already are taken",
      });
    }

    var validRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if (!email.match(validRegex)) {
      res.json({
        message: "Email isn't valid",
      });
    }

    if (!username.match(/^[a-zA-Z0-9._]*$/)) {
      res.json({
        message: "Username isn't valid",
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const newUser = new User({
      full_name,
      username,
      password: hash,
      email,
    });

    const v_token = jwt.sign(
      {
        email: newUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    await newUser.save();
    const user = await User.findOne({ username });
    console.log(user.id);

    // verification email
    const url = `${process.env.BASE_URL}verify/${v_token}`;
    mailTransport().sendMail({
      from: process.env.USER,
      to: newUser.email,
      subject: "Verify your email account",
      html: `<h1>${url}</h1>`,
    });
    ////////////////////////////////////////
    return {
      newUser,
      message: "An Email sent to your account please verify",
    };
  } else res.json({ message: "Different passwords" });
};
const login = async (req, res) => {
  const { username_or_email, password } = req.body;

  if (!username_or_email || !password) {
    res.json({ message: "Content can not be empty" });
    return;
  }

  let user = await User.findOne({ email: username_or_email });

  if (!user) {
    user = await User.findOne({ username: username_or_email });
  }

  if (!user) {
    res.json({ message: "User not exist" });
    return;
  }

  const v_token = jwt.sign(
    {
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  if (!user.verified) {
    const url = `${process.env.BASE_URL}verify/${v_token}`;
    mailTransport().sendMail({
      from: process.env.USER,
      to: user.email,
      subject: "Verify your email account",
      html: `<h1>${url}</h1>`,
    });
    res.json({ message: "An Email sent to your account again" });
    return;
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    res.json({ message: "Uncorrect password" });
    return;
  }

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

  return {
    user,
    message: "You are signed in",
  };
};
const logout = async (req, res) => {
  if (!req.cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true });
  res.clearCookie("accessToken", {
    httpOnly: true,
  });
  res.json({ message: "Cookie cleared" });
  return;
};
const verifyEmail = async (req, res) => {
  jwt.verify(
    req.params.token,
    process.env.JWT_SECRET,
    asyncHandler(async (err, decoded) => {
      req.decoded = decoded.email;
      if (err) {
        res.json({ message: "Forbidden" });
        return;
      }
    })
  );
  const user = await User.findOne({ email: req.decoded });

  if (!user) {
    res.json({ message: "Sorry, user not found!" });
    return;
  }

  if (user.verified) {
    res.json({
      message: "This account is already verified!",
    });
    return;
  }

  user.verified = true;
  await user.save();

  res.json({ message: "Your email is verified" });
  return;
};
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate({
      path: "subscriptions_events",
    })
    .populate({
      path: "subscriptions_companies",
    })
    .populate("companies");

  if (!user) {
    res.json({
      message: "That user is not exist",
    });
    return;
  }
  return {
    user,
  };
};
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.json({ message: "Content can not be empty" });
    return;
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.json({ message: "This email is not registered in our system" });
    return;
  }

  const v_token = jwt.sign(
    {
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  // здесь ссылка на страницу с полями, в по нажатию на эту кнопку уже вот эта ссылка
  const url = `${process.env.BASE_URL}recover/${v_token}`;
  mailTransport().sendMail({
    from: process.env.USER,
    to: user.email,
    subject: "Reset your password",
    html: `<h1>${url}</h1>`,
  });
  res.json({ message: "Re-send the password, please check your email" });
  return;
};
const reset = async (req, res) => {
  const { new_password, confirm_password } = req.body;

  if (!new_password || !confirm_password || !req.params.token) {
    res.json({ message: "Content can not be empty" });
    return;
  }

  jwt.verify(
    req.params.token,
    process.env.JWT_SECRET,
    asyncHandler(async (err, decoded) => {
      if (decoded === undefined) {
        res.json({ message: "Wrong token" });
        return;
      }
      req.decoded = decoded.email;
      if (err) {
        res.json({ message: "Forbidden" });
        return;
      }
    })
  );

  const user = await User.findOne({ email: req.decoded });
  if (!user) {
    res.json({ message: "Sorry, user not found!" });
    return;
  }

  if (new_password != confirm_password) {
    res.json({ message: "Passwords are different" });
    return;
  }

  const isPasswordCorrect = await bcrypt.compare(new_password, user.password);
  if (isPasswordCorrect) {
    res.json({
      message: "Your new password has to be different from your old",
    });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(new_password, salt);

  user.password = hash;
  await user.save();
  res.json({ message: "Your password was changed" });
  return;
};

export default {
  register,
  login,
  logout,
  verifyEmail,
  getMe,
  forgotPassword,
  reset,
};
