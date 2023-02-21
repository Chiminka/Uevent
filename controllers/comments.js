import commentService from "../services/commentsService.js";

export class CommentController {
  // Get Comment By Id
  async byId(req, res) {
    try {
      const byId = await commentService.byId(req.params.id);
      res.json(byId);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong" });
    }
  }
  // Remove comment
  async removeComment(req, res) {
    try {
      const removeComment = await commentService.removeComment(
        req.user._id,
        req.params.id
      );
      res.json(removeComment);
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
  // Update Comment
  async UpdateComment(req, res) {
    try {
      const UpdateComment = await commentService.UpdateComment(
        req.user.id,
        req.params.id,
        req.body
      );
      res.json(UpdateComment);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong" });
    }
  }
}
