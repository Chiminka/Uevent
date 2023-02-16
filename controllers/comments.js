import Comment from "../models/Comment.js";
import User from "../models/User.js";

export class CommentController {
  // Get Comment By Id
  async byId(req, res) {
    try {
      const comment = await Comment.findById(req.params.id);
      res.json(comment);
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
  // Remove comment
  async removeComment(req, res) {
    try {
      //если коммент юзера
      const userId = req.user._id;
      const comment_user = await Comment.findById(req.params.id);
      if (userId.equals(comment_user.author)) {
        const comment = await Comment.findByIdAndDelete(req.params.id);
        if (!comment) return res.json({ message: "That comment is not exist" });
        res.json({ message: "Comment was deleted" });
      } else return res.json({ message: "That's not your comment" });
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
  // Update Comment
  async UpdateComment(req, res) {
    try {
      //только юзер свой
      const userId = await User.findById(req.user.id);
      const comment_user = await Comment.findById(req.params.id);
      const uId = userId._id;
      if (uId.equals(comment_user.author)) {
        const { comment } = req.body;
        const com = await Comment.findById(req.params.id);
        com.comment = comment;
        await com.save();
        res.json(com);
      } else return res.json("That's not your comment");
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong" });
    }
  }
}
