import Event from "../models/Event.js";
import Category from "../models/Category.js";

const format_sort = async () => {
  // Получаем все категории с типом "format" и сортируем их по содержимому категории
  const formatCategories = await Category.find({ type: "format" }).sort(
    "content"
  );
  // Получаем все мероприятия с категориями, включая категории с типом "format"
  const events = await Event.find({ visible: "yes" }).populate("categories");
  // Отбираем мероприятия с категориями, включая только те, которые имеют тип "format"
  const formatEvents = events.filter((event) =>
    event.categories.some((category) => category.type === "format")
  );
  // Сортируем мероприятия с категориями типа "format" по содержимому категории
  formatEvents.sort((a, b) => {
    const categoryA = a.categories.find(
      (category) => category.type === "format"
    );
    const categoryB = b.categories.find(
      (category) => category.type === "format"
    );
    return categoryA.content.localeCompare(categoryB.content);
  });
  // Отбираем мероприятия с категориями, не включающими категории типа "format"
  const nonFormatEvents = events.filter((event) =>
    event.categories.every((category) => category.type !== "format")
  );
  // Сортируем мероприятия с категориями, не включающими категории типа "format" по дате
  nonFormatEvents.sort((a, b) => b.date_event - a.date_event);
  // Объединяем массивы отсортированных мероприятий
  const sortedEvents = formatEvents.concat(nonFormatEvents);
  // Возвращаем отсортированный массив мероприятий
  return sortedEvents;
};
const themes_sort = async () => {
  // Получаем все категории с типом "themes" и сортируем их по содержимому категории
  const themesCategories = await Category.find({ type: "themes" }).sort(
    "content"
  );
  // Получаем все мероприятия с категориями, включая категории с типом "themes"
  const events = await Event.find({ visible: "yes" }).populate("categories");
  // Отбираем мероприятия с категориями, включая только те, которые имеют тип "themes"
  const themesEvents = events.filter((event) =>
    event.categories.some((category) => category.type === "themes")
  );
  // Сортируем мероприятия с категориями типа "themes" по содержимому категории
  themesEvents.sort((a, b) => {
    const categoryA = a.categories.find(
      (category) => category.type === "themes"
    );
    const categoryB = b.categories.find(
      (category) => category.type === "themes"
    );
    return categoryA.content.localeCompare(categoryB.content);
  });
  // Отбираем мероприятия с категориями, не включающими категории типа "themes"
  const nonThemesEvents = events.filter((event) =>
    event.categories.every((category) => category.type !== "themes")
  );
  // Сортируем мероприятия с категориями, не включающими категории типа "themes" по дате
  nonThemesEvents.sort((a, b) => b.date_event - a.date_event);
  // Объединяем массивы отсортированных мероприятий
  const sortedEvents = themesEvents.concat(nonThemesEvents);
  // Возвращаем отсортированный массив мероприятий
  return sortedEvents;
};
const date_sort = async () => {
  const sortedEvents = await Event.find({ visible: "yes" }).sort("-date_event");
  return sortedEvents;
};

export { format_sort, themes_sort, date_sort };
