import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  price: {
    type: Number,
    required: true,
  },
  seat: {
    type: String,
  },
  visible: {
    type: String,
    default: "yes",
  },
});
export default mongoose.model("Ticket", TicketSchema);
