import Category from "../models/Category.js";
import Event from "../models/Event.js";

export class CategoryController {
  async allCategories(req, res) {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
  async byId(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      res.json(category);
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
  async categoryEvents(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      const categoryId = category.id;
      const events = await Event.find({ categories: { _id: categoryId } });
      res.json(events);
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
}
