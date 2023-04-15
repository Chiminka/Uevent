import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  company_name: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default:
      "depositphotos_200738788-stock-illustration-default-placeholder-businesswoman-half-length.jpg",
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    required: true,
  },
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
export default mongoose.model("Company", CompanySchema);
