import mongoose from "mongoose";

const ThemeSchema = new mongoose.Schema({
  content: { type: String, required: true },
});
export default mongoose.model("Theme", ThemeSchema);
