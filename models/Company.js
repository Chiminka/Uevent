import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  company_name: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    required: true,
  },
});
export default mongoose.model("Company", CompanySchema);
