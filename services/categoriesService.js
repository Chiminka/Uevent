import Category from "../models/Category.js";
import Event from "../models/Event.js";

const allCategories = async () => {
  const categories = await Category.find();
  return categories;
};
const allFormats = async () => {
  const categories = await Category.find({ type: "format" });
  return categories;
};
const allThemes = async () => {
  const categories = await Category.find({ type: "themes" });
  return categories;
};
const byId = async (id) => {
  const category = await Category.findById(id);
  return category;
};
const categoryEvents = async (id) => {
  const category = await Category.findById(id);
  const categoryId = category.id;
  const events = await Event.find({ categories: { _id: categoryId } });
  return events;
};

export default { allCategories, byId, categoryEvents, allFormats, allThemes };
