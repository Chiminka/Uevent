import Comment from "../models/Comment.js";
import User from "../models/User.js";

const byId = async (req) => {
  const comment = await Comment.findById(req.params.id).populate({
    path: "author",
    select: "username avatar",
  });
  return comment;
};
const removeComment = async (req, res) => {
  //если коммент юзера
  const comment_user = await Comment.findById(req.params.id);
  if (req.user._id.equals(comment_user.author)) {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return { message: "That comment is not exist" };
    }
    return { message: "Comment was deleted" };
  } else {
    return { message: "That's not your comment" };
  }
};
const UpdateComment = async (res, req) => {
  //только юзер свой
  const userId = await User.findById(req.user.id);
  const comment_user = await Comment.findById(req.params.id);
  const uId = userId._id;
  if (uId.equals(comment_user.author)) {
    const { comment } = req.body;
    const com = await Comment.findById(req.params.id);
    com.comment = comment;
    await com.save();
    return { com };
  } else {
    return { message: "That's not your comment" };
  }
};

export default { byId, removeComment, UpdateComment };
