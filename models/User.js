import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default:
      "depositphotos_200738788-stock-illustration-default-placeholder-businesswoman-half-length.jpg",
  },
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
  subscriptions_companies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: [],
    },
  ],
  subscriptions_events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
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
  social_net: {
    instagram: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
    telegram: {
      type: String,
      default: "",
    },
    whatsapp: {
      type: String,
      default: "",
    },
    viber: {
      type: String,
      default: "",
    },
  },
});
export default mongoose.model("User", UserSchema);
