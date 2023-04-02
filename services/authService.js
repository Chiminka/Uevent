import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailTransport from "../utils/mailTransport.js";
import asyncHandler from "express-async-handler";

const register = async (userData) => {
  const { username, full_name, password, email, repeatPassword } = userData;

  if (!username || !password || !email || !repeatPassword)
    return { message: "Content can not be empty" };

  if (password === repeatPassword) {
    const usernameExist = await User.findOne({ username });
    const emailExist = await User.findOne({ email });
    console.log(usernameExist, emailExist);
    if (emailExist || usernameExist) {
      return {
        message: "These username or email already are taken",
      };
    }

    var validRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if (!email.match(validRegex)) {
      return {
        message: "Email isn't valid",
      };
    }

    if (!username.match(/^[a-zA-Z0-9._]*$/)) {
      return {
        message: "Username isn't valid",
      };
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
  } else return { message: "Different passwords" };
};
const login = async (userData, res) => {
  const { username_or_email, password } = userData;

  if (!username_or_email || !password)
    return { message: "Content can not be empty" };

  let user = await User.findOne({ email: username_or_email });

  if (!user) {
    user = await User.findOne({ username: username_or_email });
  }

  if (!user) {
    return { success: false, message: "User not exist" };
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
    return { message: "An Email sent to your account again" };
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return { success: false, message: "Uncorrect password" };
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
const logout = async (cookies, res) => {
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true });
  res.clearCookie("accessToken", {
    httpOnly: true,
  });
  return { message: "Cookie cleared" };
};
const verifyEmail = async (token, req) => {
  jwt.verify(
    token,
    process.env.JWT_SECRET,
    asyncHandler(async (err, decoded) => {
      req.decoded = decoded.email;
      if (err) return { message: "Forbidden" };
    })
  );
  const user = await User.findOne({ email: req.decoded });
  if (!user) return { success: false, message: "Sorry, user not found!" };

  if (user.verified)
    return {
      success: false,
      message: "This account is already verified!",
    };

  user.verified = true;
  await user.save();
  return { success: true, message: "Your email is verified" };
};
const getMe = async (user_id) => {
  const user = await User.findById(user_id);
  if (!user) {
    return {
      message: "That user is not exist",
    };
  }
  return {
    user,
  };
};
const forgotPassword = async (body) => {
  const { email } = body;

  if (!email) return { message: "Content can not be empty" };

  const user = await User.findOne({ email });

  if (!user) return { msg: "This email is not registered in our system" };

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
  return { message: "Re-send the password, please check your email" };
};
const reset = async (body, token, req) => {
  const { new_password, confirm_password } = body;

  if (!new_password || !confirm_password || !token) {
    return { message: "Content can not be empty" };
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    asyncHandler(async (err, decoded) => {
      if (decoded === undefined) return { message: "Wrong token" };
      req.decoded = decoded.email;
      if (err) return { message: "Forbidden" };
    })
  );

  const user = await User.findOne({ email: req.decoded });
  if (!user) return { success: false, message: "Sorry, user not found!" };

  if (new_password != confirm_password)
    return { message: "Passwords are different" };

  const isPasswordCorrect = await bcrypt.compare(new_password, user.password);
  if (isPasswordCorrect)
    return {
      message: "Your new password has to be different from your old",
    };

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(new_password, salt);

  user.password = hash;
  await user.save();
  return { success: true, message: "Your password was changed" };
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
