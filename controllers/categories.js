import categoryService from "../services/categoriesService.js";

export class CategoryController {
  async allCategories(req, res) {
    try {
      const allCategories = await categoryService.allCategories();
      res.json(allCategories);
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
  async byId(req, res) {
    try {
      const byId = await categoryService.byId(req.params.id);
      res.json(byId);
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
  async categoryEvents(req, res) {
    try {
      const categoryEvents = await categoryService.categoryEvents(
        req.params.id
      );
      res.json(categoryEvents);
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
}
