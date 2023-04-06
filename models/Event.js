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
  date_end: {
    type: Date,
  },
  date_post: {
    type: Date,
    required: false,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  location: {
    type: Object,
    required: true,
  },
  tickets: {
    type: Number,
    default: "10",
  },
  themes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theme",
    },
  ],
  formats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Format",
    },
  ],
  img: {
    type: String,
    default: "images.jpg",
  },
  notifications: {
    type: Boolean,
    default: false,
  },
  members_visibles: {
    type: String,
    default: "everyone",
  },
  visible: {
    type: String,
    default: "no",
  },
});
export default mongoose.model("Event", EventSchema);

//members_visibles: everyone || only_members
//notifications - надо ли уведомлять о добавленных мемберах
//visible - если пользователь отложил пост на какое-то время
