import Event from "../models/Event.js";
import Theme from "../models/Theme.js";
import Format from "../models/Format.js";

const format_sort = async () => {
  // Получаем список всех ивентов из базы данных
  const events = await Event.find();

  // Для каждого ивента получаем список форматов и сортируем его по контенту форматов
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const formats = await Format.find({ _id: { $in: event.formats } }).sort({
      content: 1,
    });
    event.formats = formats;
    const themes = await Theme.find({ _id: { $in: event.themes } });
    event.themes = themes;
  }

  // Отсортировываем ивенты по контенту форматов
  events.sort((a, b) => {
    const aContent = a.formats.length > 0 ? a.formats[0].content : "";
    const bContent = b.formats.length > 0 ? b.formats[0].content : "";
    return aContent.localeCompare(bContent);
  });

  return events;
};
const themes_sort = async () => {
  // Получаем список всех ивентов из базы данных
  const events = await Event.find();

  // Для каждого ивента получаем список тематик и сортируем его по контенту тематик
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const themes = await Theme.find({ _id: { $in: event.themes } }).sort({
      content: 1,
    });
    event.themes = themes;
    const formats = await Format.find({ _id: { $in: event.formats } });
    event.formats = formats;
  }

  // Отсортировываем ивенты по контенту тематик
  events.sort((a, b) => {
    const aContent = a.themes.length > 0 ? a.themes[0].content : "";
    const bContent = b.themes.length > 0 ? b.themes[0].content : "";
    return aContent.localeCompare(bContent);
  });

  return events;
};
const date_sort = async () => {
  const sortedEvents = await Event.find({ visible: "yes" }).sort("-date_event");
  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    const themes = await Theme.find({ _id: { $in: event.themes } });
    event.themes = themes;
    const formats = await Format.find({ _id: { $in: event.formats } });
    event.formats = formats;
  }
  return sortedEvents;
};

export { format_sort, themes_sort, date_sort };
