import mongoose from "mongoose";

const Promo_codeSchema = new mongoose.Schema({
  promo_code: {
    type: String,
    default: "",
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  expiration_date: {
    type: Date,
    required: true,
  },
});
export default mongoose.model("Promo_code", Promo_codeSchema);
