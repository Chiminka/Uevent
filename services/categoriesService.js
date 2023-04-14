// import Category from "../models/Category.js";
import Theme from "../models/Theme.js";
import Format from "../models/Format.js";
import Event from "../models/Event.js";

const allCategories = async () => {
  const themes = await Theme.find();
  const format = await Format.find();
  return { themes, format };
};
const allFormats = async () => {
  const format = await Format.find();
  return format;
};
const allThemes = async () => {
  const theme = await Theme.find();
  return theme;
};
const byId = async (req) => {
  let category = await Theme.findById(req.params.id);
  if (!category) category = await Format.findById(req.params.id);
  return category;
};
const categoryEvents = async (req) => {
  let category = await Theme.findById(req.params.id);
  if (!category) category = await Format.findById(req.params.id);
  const categoryId = category.id;
  let events = await Event.find({ formats: categoryId });
  if (events.length === 0) events = await Event.find({ themes: categoryId });
  return events;
};

export default { allCategories, byId, categoryEvents, allFormats, allThemes };
