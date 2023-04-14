import categoryService from "../services/categoriesService.js";

export class CategoryController {
  async allCategories(req, res) {
    try {
      const allCategories = await categoryService.allCategories();
      res.json(allCategories);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong5" });
    }
  }
  async allFormats(req, res) {
    try {
      const allFormats = await categoryService.allFormats();
      res.json(allFormats);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong4" });
    }
  }
  async allThemes(req, res) {
    try {
      const allThemes = await categoryService.allThemes();
      res.json(allThemes);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong3" });
    }
  }
  async byId(req, res) {
    try {
      const byId = await categoryService.byId(req, res);
      res.json(byId);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong2" });
    }
  }
  async categoryEvents(req, res) {
    try {
      const categoryEvents = await categoryService.categoryEvents(req, res);
      res.json(categoryEvents);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong1" });
    }
  }
}
