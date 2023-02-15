import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailTransport from "../utils/mailTransport.js";
import asyncHandler from "express-async-handler";

export class AuthController {
  async register(req, res) {
    try {
      const {
        username,
        full_name,
        password,
        email,
        repeatPassword,
        role,
        location,
      } = req.body;

      if (!username || !password || !email || !repeatPassword)
        return res.json({ message: "Content can not be empty" });

      if (password === repeatPassword) {
        const usernameExist = await User.findOne({ username });
        const emailExist = await User.findOne({ email });
        console.log(usernameExist, emailExist);
        if (emailExist || usernameExist) {
          return res.json({
            message: "These username or email already are taken",
          });
        }

        var validRegex =
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

        if (!email.match(validRegex)) {
          return res.json({
            message: "Email isn't valid",
          });
        }

        if (!username.match(/^[a-zA-Z0-9._]*$/)) {
          return res.json({
            message: "Username isn't valid",
          });
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        const newUser = new User({
          full_name,
          role,
          location,
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
        res.json({
          newUser,
          message: "An Email sent to your account please verify",
        });
      } else return res.json({ message: "Different passwords" });
    } catch (error) {
      console.log(error);
      res.json({ message: "Creating user error" });
    }
  }
  async login(req, res) {
    try {
      const { username_or_email, password } = req.body;

      if (!username_or_email || !password)
        return res.json({ message: "Content can not be empty" });

      let user = await User.findOne({ email: username_or_email });

      if (!user) {
        user = await User.findOne({ username: username_or_email });
      }

      if (!user) {
        return res.json({ success: false, message: "User not exist" });
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
        return res.json({ message: "An Email sent to your account again" });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.json({ success: false, message: "Uncorrect password" });
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

      res.json({
        user,
        message: "You are signed in",
      });
    } catch (error) {
      console.log(error);
      return res.json({ message: "Autorization error" });
    }
  }
  async logout(req, res) {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); //No content
    res.clearCookie("jwt", { httpOnly: true });
    res.clearCookie("accessToken", {
      httpOnly: true,
    });
    res.json({ message: "Cookie cleared" });
  }
  async verifyEmail(req, res) {
    const token = req.params.token;

    jwt.verify(
      token,
      process.env.JWT_SECRET,
      asyncHandler(async (err, decoded) => {
        req.decoded = decoded.email;
        if (err) return res.status(403).json({ message: "Forbidden" });
      })
    );
    const user = await User.findOne({ email: req.decoded });
    if (!user)
      return res.json({ success: false, message: "Sorry, user not found!" });

    if (user.verified)
      return res.json({
        success: false,
        message: "This account is already verified!",
      });

    user.verified = true;
    await user.save();
    res.json({ success: true, message: "Your email is verified" });
  }
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.json({
          message: "That user is not exist",
        });
      }
      res.json({
        user,
      });
    } catch (error) {
      res.json({ message: "Not access" });
    }
  }
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) return res.json({ message: "Content can not be empty" });

      const user = await User.findOne({ email });

      if (!user)
        return res.json({ msg: "This email is not registered in our system" });

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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  async reset(req, res) {
    const { new_password, confirm_password } = req.body;

    if (!new_password || !confirm_password)
      return res.json({ message: "Content can not be empty" });

    const token = req.params.token;
    jwt.verify(
      token,
      process.env.JWT_SECRET,
      asyncHandler(async (err, decoded) => {
        req.decoded = decoded.email;
        if (err) return res.status(403).json({ message: "Forbidden" });
      })
    );
    const user = await User.findOne({ email: req.decoded });
    if (!user)
      return res.json({ success: false, message: "Sorry, user not found!" });

    if (new_password != confirm_password)
      return res.json({ message: "Passwords are different" });

    const isPasswordCorrect = await bcrypt.compare(new_password, user.password);
    if (isPasswordCorrect)
      return res.json({
        message: "Your new password has to be different from your old",
      });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(new_password, salt);

    user.password = hash;
    await user.save();
    res.json({ success: true, message: "Your password was changed" });
  }
}
