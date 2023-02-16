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
  format: {
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
    default:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw-ByquDvpBITEAHnGNeqUyQGw7KX3gqz3A5vQyICAV67mzUB2G8HECVilUr521eXJx04&usqp=CAU",
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

//members_visibles: everyone || only_members
//notifications - надо ли уведомлять о добавленных мемберах
//visible - ??
// стоит отделить формат и тематику в отдельную модель
