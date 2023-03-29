import mongoose from "mongoose";

const FormatSchema = new mongoose.Schema({
  content: { type: String, required: true },
});
export default mongoose.model("Format", FormatSchema);
