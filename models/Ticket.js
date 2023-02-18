import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  visible: {
    type: String,
    default: "yes",
  },
});
export default mongoose.model("Ticket", TicketSchema);
