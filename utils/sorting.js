import Event from "../models/Event.js";
import Theme from "../models/Theme.js";
import Format from "../models/Format.js";

const format_sort = async (filterThemesArray, filterFormatsArray, search) => {
  const filter = {};
  if (filterThemesArray && filterFormatsArray) {
    filter.$and = [
      { themes: { $in: filterThemesArray } },
      { formats: { $in: filterFormatsArray } },
    ];
  } else if (filterThemesArray) {
    filter.themes = { $in: filterThemesArray };
  } else if (filterFormatsArray) {
    filter.formats = { $in: filterFormatsArray };
  }

  const searchRegex = new RegExp(search, "i");

  const events = await Event.find(filter)
    .populate({
      path: "formats",
      options: { sort: { content: 1 } },
    })
    .populate("themes")
    .or([
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
    ])
    .sort({ "formats.content": 1 });

  return events;
};
const themes_sort = async (filterThemesArray, filterFormatsArray, search) => {
  const filter = {};

  if (filterThemesArray && filterFormatsArray) {
    filter.$and = [
      { themes: { $in: filterThemesArray } },
      { formats: { $in: filterFormatsArray } },
    ];
  } else if (filterThemesArray) {
    filter.themes = { $in: filterThemesArray };
  } else if (filterFormatsArray) {
    filter.formats = { $in: filterFormatsArray };
  }

  const events = await Event.find(filter)
    .populate("themes", "content")
    .populate("formats")
    .sort({ "themes.content": 1 });

  const searchTerm = search.toLowerCase();
  const filteredEvents = events.filter((event) => {
    const title = event.title.toLowerCase();
    const description = event.description.toLowerCase();
    return title.includes(searchTerm) || description.includes(searchTerm);
  });

  return filteredEvents;
};
const date_sort = async (filterThemesArray, filterFormatsArray, search) => {
  const filter =
    filterThemesArray || filterFormatsArray
      ? {
          $and: [
            ...(filterThemesArray
              ? [{ themes: { $in: filterThemesArray } }]
              : []),
            ...(filterFormatsArray
              ? [{ formats: { $in: filterFormatsArray } }]
              : []),
          ],
        }
      : { visible: "yes" };

  const sortedEvents = await Event.find(filter)
    .sort("-date_event")
    .then((events) =>
      events.filter(({ title, description }) => {
        const searchTerm = search.toLowerCase();
        return (
          title.toLowerCase().includes(searchTerm) ||
          description.toLowerCase().includes(searchTerm)
        );
      })
    );

  const eventThemes = await Promise.all(
    sortedEvents.map((event) => Theme.find({ _id: { $in: event.themes } }))
  );
  const eventFormats = await Promise.all(
    sortedEvents.map((event) => Format.find({ _id: { $in: event.formats } }))
  );

  const eventsWithThemesAndFormats = sortedEvents.map((event, i) => ({
    ...event.toObject(),
    themes: eventThemes[i],
    formats: eventFormats[i],
  }));

  return eventsWithThemesAndFormats;
};

export { format_sort, themes_sort, date_sort };
