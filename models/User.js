import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default:
      "https://st4.depositphotos.com/9998432/20073/v/950/depositphotos_200738788-stock-illustration-default-placeholder-businesswoman-half-length.jpg?forcejpeg=true",
  },
  my_promo_codes: [
    {
      type: String,
      default: "",
    },
  ],
  full_name: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },
  subscriptions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      default: [],
    },
  ],
  companies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: [],
    },
  ],
});
export default mongoose.model("User", UserSchema);
