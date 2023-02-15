import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
    default: "New event",
  },
  description: {
    type: String,
  },
  date_event: {
    type: Date,
    required: true,
  },
  date_post: {
    type: Date,
    required: false,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  tickets: {
    type: Number,
    default: "10",
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  img: {
    type: String,
    default: "",
  },
  notifications: {
    type: String,
    default: "no",
  },
  members_visibles: {
    type: String,
    default: "everyone",
  },
  promo_code: {
    type: String,
    default: "",
  },
  visible: {
    type: String,
    default: "no",
  },
});
export default mongoose.model("Event", EventSchema);
