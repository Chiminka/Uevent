import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";

import authRoute from "./routes/auth.js";
import usersRoute from "./routes/users.js";
import eventRoute from "./routes/events.js";
import { post_it_now } from "./utils/post_it_now.js";
import adminRouter from "./routes/admin.router.js";
// import stripe from "./routes/stripe.js";
import commentRoute from "./routes/comments.js";
import categoryRoute from "./routes/categories.js";

const app = express();
dotenv.config();

// Constants
const PORT = process.env.PORT || 3001;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

app.use("/admin", adminRouter);

// Middleware
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("uploads"));

// Routes
// http://localhost:3002
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/events", eventRoute);
app.use("/api/comments", commentRoute);
app.use("/api/categories", categoryRoute);
// app.use("/api/stripe", stripe);

async function start() {
  try {
    mongoose.set("strictQuery", false);
    mongoose.connect(
      `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.zttzlin.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,
      () => {
        console.log("Connected to MongoDB");
      }
    );
    post_it_now();
    app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
  } catch (error) {
    console.log(error);
  }
}
start();
