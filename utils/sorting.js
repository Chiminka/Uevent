import Event from "../models/Event.js";
import Theme from "../models/Theme.js";
import Format from "../models/Format.js";

const format_sort = async (filterThemesArray, filterFormatsArray, search) => {
  let filter = {};
  if (filterThemesArray && filterFormatsArray) {
    filter = {
      $and: [
        { themes: { $in: filterThemesArray } },
        { formats: { $in: filterFormatsArray } },
      ],
    };
  } else if (filterThemesArray) {
    filter = {
      $and: [{ themes: { $in: filterThemesArray } }],
    };
  } else if (filterFormatsArray) {
    filter = {
      $and: [{ formats: { $in: filterFormatsArray } }],
    };
  }

  // Получаем список всех ивентов из базы данных
  let events = filter ? await Event.find(filter) : await Event.find();

  events = events.filter((event) => {
    const title = event.title.toLowerCase();
    const description = event.description.toLowerCase();
    const searchTerm = search.toLowerCase();
    return title.includes(searchTerm) || description.includes(searchTerm);
  });

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
const themes_sort = async (filterThemesArray, filterFormatsArray, search) => {
  let filter = {};
  if (filterThemesArray && filterFormatsArray) {
    filter = {
      $and: [
        { themes: { $in: filterThemesArray } },
        { formats: { $in: filterFormatsArray } },
      ],
    };
  } else if (filterThemesArray) {
    filter = {
      $and: [{ themes: { $in: filterThemesArray } }],
    };
  } else if (filterFormatsArray) {
    filter = {
      $and: [{ formats: { $in: filterFormatsArray } }],
    };
  }

  // Получаем список всех ивентов из базы данных
  let events = filter ? await Event.find(filter) : await Event.find();

  console.log(events);

  events = events.filter((event) => {
    const title = event.title.toLowerCase();
    const description = event.description.toLowerCase();
    const searchTerm = search.toLowerCase();
    return title.includes(searchTerm) || description.includes(searchTerm);
  });

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
const date_sort = async (filterThemesArray, filterFormatsArray, search) => {
  let filter = { visible: "yes" };
  if (filterThemesArray && filterFormatsArray) {
    filter = {
      $and: [
        { themes: { $in: filterThemesArray } },
        { formats: { $in: filterFormatsArray } },
      ],
    };
  } else if (filterThemesArray) {
    filter = {
      $and: [{ themes: { $in: filterThemesArray } }],
    };
  } else if (filterFormatsArray) {
    filter = {
      $and: [{ formats: { $in: filterFormatsArray } }],
    };
  }

  // Получаем список всех ивентов из базы данных
  let sortedEvents = [];

  if (filter) {
    sortedEvents = await Event.find(filter).sort("-date_event");
    console.log(filter, "1");
  } else {
    sortedEvents = await Event.find({ visible: "yes" }).sort("-date_event");
    console.log(filter, "2");
  }

  sortedEvents = sortedEvents.filter((event) => {
    const title = event.title.toLowerCase();
    const description = event.description.toLowerCase();
    const searchTerm = search.toLowerCase();
    return title.includes(searchTerm) || description.includes(searchTerm);
  });

  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    const themes = await Theme.find({ _id: { $in: event.themes } });
    event.themes = themes;
    const formats = await Format.find({ _id: { $in: event.formats } });
    event.formats = formats;
  }

  return sortedEvents;
};

// const filter_format = async () => {
//   const filteredEvents = await Event.find();
//   let mas = [];
//   for (let i = 0; i < filteredEvents.length; i++) {
//     if (filteredEvents[i].formats.toString() !== "64269fe08d89323058b7a30f") {
//       const event = await Event.findById(filteredEvents[i].id);
//       const themes = await Theme.find({ _id: { $in: event.themes } });
//       event.themes = themes;
//       const formats = await Format.find({ _id: { $in: event.formats } });
//       event.formats = formats;
//       mas.push(event);
//     }
//   }
//   return mas;
// };
// const filter_themes = async () => {
//   const filteredEvents = await Event.find();
//   let mas = [];
//   for (let i = 0; i < filteredEvents.length; i++) {
//     if (filteredEvents[i].themes.toString() !== "64269fd38d89323058b7a309") {
//       const event = await Event.findById(filteredEvents[i].id);
//       const themes = await Theme.find({ _id: { $in: event.themes } });
//       event.themes = themes;
//       const formats = await Format.find({ _id: { $in: event.formats } });
//       event.formats = formats;
//       mas.push(event);
//     }
//   }
//   return mas;
// };

export { format_sort, themes_sort, date_sort };
