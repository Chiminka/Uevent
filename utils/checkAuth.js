import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";

const refresh = async (req, res, next, cookies) => {
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        email: decoded.email,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        { UserInfo: { email: foundUser.email } },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { email: foundUser.email },
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

      req.user = foundUser;
      next();
    })
  );
};

export const verifyJWT = async (req, res, next) => {
  const cookies = req.cookies;
  if (!cookies?.accessToken)
    return res.status(401).json({ message: "Unauthorized" });
  if (cookies.accessToken) {
    const token = cookies.accessToken;
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ email: decode.UserInfo.email });
      if (!user) {
        return res.json({ success: false, message: "1unauthorized access!" });
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.json({ success: false, message: "2unauthorized access!" });
      }
      if (error.name === "TokenExpiredError") {
        refresh(req, res, next, cookies);
        return;
        // return res.json({
        //   success: false,
        //   message: "sesson expired try sign in!",
        // });
      }
      return res.json({ success: false, message: "Internal server error!" });
    }
  } else {
    // console.log(req.headers)
    res.json({ success: false, message: "3unauthorized access!" });
  }
};
