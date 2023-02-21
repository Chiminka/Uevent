import Comment from "../models/Comment.js";
import User from "../models/User.js";

const byId = async (id) => {
  const comment = await Comment.findById(id);
  return comment;
};
const removeComment = async (userId, id) => {
  //если коммент юзера
  const comment_user = await Comment.findById(id);
  if (userId.equals(comment_user.author)) {
    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) return { message: "That comment is not exist" };
    return { message: "Comment was deleted" };
  } else return { message: "That's not your comment" };
};
const UpdateComment = async (user, id, body) => {
  //только юзер свой
  const userId = await User.findById(user);
  const comment_user = await Comment.findById(id);
  const uId = userId._id;
  if (uId.equals(comment_user.author)) {
    const { comment } = body;
    const com = await Comment.findById(id);
    com.comment = comment;
    await com.save();
    return com;
  } else return "That's not your comment";
};

export default { byId, removeComment, UpdateComment };
