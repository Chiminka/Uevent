import Event from "../models/Event.js";
import User from "../models/User.js";
// import Category from "../models/Category.js";
import Comment from "../models/Comment.js";
import Ticket from "../models/Ticket.js";
import Company from "../models/Company.js";
import Promocode from "../models/Promocode.js";

import promo from "../utils/create_promo.js";
import { format_sort, themes_sort, date_sort } from "../utils/sorting.js";
import mailTransport from "../utils/mailTransport.js";
import Stripe from "stripe";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import Format from "../models/Format.js";
import Theme from "../models/Theme.js";
import fs from "fs";
import util from "util";

console.log(process.env.STRIPE_KEY);

const stripe = Stripe(
  "sk_test_51Mbl5wGCxeoiwh2aTPy6BSwW9QSyQ0cIcI6yXJp7VVxZfRSZotUrxcRT2wqgY0I11ONDTaAJGIjtgno2pMXyp9mR00PkoU2gNj"
);
const mkdir = util.promisify(fs.mkdir);

const getEventById = async (id, userID) => {
  const [event, all_events, ticket] = await Promise.all([
    Event.findById(id)
      .populate("author")
      .populate("themes")
      .populate("formats"),
    Event.find().populate("author").populate("themes").populate("formats"),
    Ticket.find({ event: id }).populate("user"),
  ]);

  const members = ticket
    .filter(
      (t) =>
        event.members_visibles === "everyone" ||
        (userID && t.user.id.toString() === userID.toString())
    )
    .filter((t) => t.visible === "yes")
    .map((t) => t.user);

  // тематики и форматы которые есть у нашего ивента
  const { themes, formats } = event;
  const themesSet = new Set(themes.map((t) => t.id));
  const formatsSet = new Set(formats.map((f) => f.id));

  // если массив themes элемента е имеет хотя бы какое-то (some) айди t, которое иммет
  // вхождение (has) в массив themesSet, то суем этот элемент в similar_events
  const similar_events = all_events.filter((e) => {
    if (e.id === id) return false;

    const intersectThemes = e.themes.some((t) => themesSet.has(t.id));
    const intersectFormats = e.formats.some((f) => formatsSet.has(f.id));

    // возвращает тру фолз
    return intersectThemes || intersectFormats;
  });

  return { event, similar_events, members };
};
const getAllEvents = async (req) => {
  const { sort: categoryType } = req.params;
  const filterThemesArray = req.query.filterThemes || null;
  const filterFormatsArray = req.query.filterFormats || null;
  const search = req.query.search;

  const getResult = async (categoryType) => {
    switch (categoryType) {
      case "format":
        return await format_sort(filterThemesArray, filterFormatsArray, search);
      case "themes":
        return await themes_sort(filterThemesArray, filterFormatsArray, search);
      case "date":
        return await date_sort(filterThemesArray, filterFormatsArray, search);
      default:
        throw new Error(`Invalid category type: ${categoryType}`);
    }
  };

  const events = await getResult(categoryType);
  const arr_event = events.filter((event) => event.tickets > 0);
  const pageSize = 10;
  const startIndex = (req.params.page - 1) * pageSize;
  const endIndex = req.params.page * pageSize;
  const pageEvents = arr_event.slice(startIndex, endIndex);
  const totalPages = Math.ceil(arr_event.length / pageSize);

  return { pageEvents, totalPages };
};
const loadPictures = async (req) => {
  const event = await Event.findById(req.params.id);
  let fileName = "";
  if (req.files) {
    fileName = Date.now().toString() + req.files.files.name;
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const uploadDir = path.join(__dirname, "..", "uploads");
    try {
      await mkdir(uploadDir);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }
    req.files.files.mv(path.join(uploadDir, fileName));
  }
  if (fileName.length < 1) {
    fileName = event.img;
  }
  if (fileName) event.img = fileName;
  await event.save();
  return event;
};
// если компания создала ивент - оповестить
const createEvent = async (req) => {
  const company = await Company.findById(req.params.id);
  const user = await User.findById(req.user.id);

  if (!company) {
    return { message: "No such a company" };
  }

  if (!user.companies.includes(company.id)) {
    return { message: "Access denied" };
  }

  if (!company.verified) {
    return { message: "Company is not verified" };
  }

  let {
    notifications,
    title,
    description,
    date_event,
    date_post,
    tickets,
    price,
    themes,
    formats,
    location,
    members_visibles,
  } = req.body;

  if (
    !title ||
    !description ||
    !date_event ||
    !tickets ||
    !location ||
    !themes ||
    !formats ||
    !price
  )
    return { message: "Content can not be empty" };

  if (date_event) {
    const date_e = new Date(`${date_event}T00:00:00`);
    date_event = !date_event.includes("T")
      ? (date_event = date_e)
      : (date_event = date_event);
  }
  if (date_post) {
    const date_p = new Date(`${date_post}T00:00:00`);
    date_post = !date_post.includes("T")
      ? (date_post = date_p)
      : (date_post = date_post);
  } else {
    date_post = new Date();
    date_post.setSeconds(date_post.getSeconds() + 70);
  }

  const newEvent = new Event({
    notifications,
    title,
    price,
    description,
    date_event,
    date_post,
    tickets,
    location,
    formats: formats,
    themes: themes,
    members_visibles,
    author: company.id,
  });

  await newEvent.save();

  // создаем новый объект Date с текущей датой и временем
  var currentDate = new Date();

  // добавляем 3 недели к текущей дате
  var futureDate = new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000);

  const newPromo = new Promocode({
    event: newEvent.id,
    promo_code: promo(),
    expiration_date: futureDate,
  });

  await newPromo.save();

  const users = await User.find();
  let arr_subs = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].subscriptions_companies)
      for (let j = 0; j < users[i].subscriptions_companies.length; j++) {
        if (
          users[i].subscriptions_companies[j].toString() ===
          company.id.toString()
        ) {
          arr_subs.push(users[i]);
        }
      }
  }
  if (arr_subs)
    for (let i = 0; i < arr_subs.length; i++) {
      const member = await User.findById(arr_subs[i].id);
      mailTransport().sendMail({
        from: company.email,
        to: member.email,
        subject: `Company ${company.company_name} created event "${newEvent.title}". Check it on the site`,
      });
    }

  return newEvent;
};
// если компания удалила ивент - оповестить
const deleteEvent = async (req) => {
  // может только компания, которая создала
  const event = await Event.findById(req.params.eventId);
  if (event === null) {
    return "this event doesn't exist";
  }
  const eventID = event.id;
  const user = await User.findById(req.user.id);
  const tickets = await Ticket.find({ event: eventID });
  const company = await Company.findById(req.params.companyId);

  if (user.companies.includes(company.id)) {
    const users = await User.find({
      $or: [
        { subscriptions_companies: company.id },
        { subscriptions_events: event.id },
      ],
    });

    const arr_subs = await Promise.all(
      users.map(async (user) => {
        const subs_events = user.subscriptions_events.filter(
          (sub) => sub.toString() !== event.id.toString()
        );

        // этот ивент удаляется из подписок
        await User.findByIdAndUpdate(user.id, {
          subscriptions_events: subs_events,
        });

        return user;
      })
    );

    // если есть подписка на компанию или ивент
    if (arr_subs.length > 0) {
      await Promise.all(
        arr_subs.map(async (member) => {
          const author = await Company.findById(event.author);
          mailTransport().sendMail({
            from: author.email,
            to: member.email,
            subject: `Company ${company.company_name} deleted event "${event.title}". Check it on the site`,
          });
        })
      );
    }

    // удаление билета на этот ивент
    if (tickets.length > 0) {
      const members = tickets.map((ticket) => ticket.user);
      await Promise.all([
        Ticket.deleteMany({ _id: { $in: tickets } }),
        Promise.all(
          members.map(async (member) => {
            const user = await User.findById(member);
            const company = await Company.findById(event.author);
            const mailOptions = {
              from: company.email,
              to: user.email,
              subject: `Event "${event.title}" was deleted by organizer`,
            };
            await mailTransport().sendMail(mailOptions);
          })
        ),
      ]);
      // удаляется промо на этот ивент и сам ивент
      await Promise.all([
        Event.findByIdAndDelete(req.params.eventId),
        Promocode.findOneAndDelete({ event: req.params.eventId }),
      ]);
      return { message: "Event was deleted and members were warned" };
    } else {
      await Promise.all([
        Event.findByIdAndDelete(req.params.eventId),
        Promocode.findOneAndDelete({ event: req.params.eventId }),
      ]);
      return { message: "Event was deleted" };
    }
  } else return { message: "No access!" };
};
// если компания изменила ивент - оповестить
const updateEvent = async (req) => {
  // может только компания, которая создала
  let {
    notifications,
    title,
    description,
    date_event,
    date_post,
    formats,
    themes,
    price,
    tickets,
    location,
    members_visibles,
  } = req.body;

  if (!req.params.companyId) return "Provide an id of event company";

  const company = await Company.findById(req.params.companyId);
  const event = await Event.findById(req.params.eventId);
  if (event === null) {
    return "this event doesn't exist";
  }

  console.log(company);
  const eventId = event.id;
  const user = await User.findById(req.user.id);

  if (user.companies.includes(company.id)) {
    const all_tickets = await Ticket.find({ event: eventId });

    const users = await User.find();
    let arr_subs = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i].subscriptions_events || users[i].subscriptions_companies) {
        for (let j = 0; j < users[i].subscriptions_events.length; j++) {
          if (
            users[i].subscriptions_events[j].toString() ===
              event.id.toString() &&
            !arr_subs.includes(users[i])
          ) {
            arr_subs.push(users[i]);
          }
        }
        for (let j = 0; j < users[i].subscriptions_companies.length; j++) {
          if (
            users[i].subscriptions_companies[j].toString() ===
              company.id.toString() &&
            !arr_subs.includes(users[i])
          ) {
            arr_subs.push(users[i]);
          }
        }
      }
    }
    console.log(arr_subs);
    if (arr_subs)
      for (let i = 0; i < arr_subs.length; i++) {
        const member = await User.findById(arr_subs[i].id);
        mailTransport().sendMail({
          from: company.email,
          to: member.email,
          subject: `Company ${company.company_name} changed event "${event.title}". Check it on the site`,
        });
      }

    if (!arr_subs && all_tickets)
      for (let i = 0; i < all_tickets.length; i++) {
        const member = await User.findById(all_tickets[i].user);
        const author = await Company.findById(event.author);
        mailTransport().sendMail({
          from: author.email,
          to: member.email,
          subject: `Event "${event.title}" was changed by organizer. Check it on the site`,
        });
      }

    if (date_event) {
      const date_e = new Date(`${date_event}T00:00:00`);
      date_event = !date_event.includes("T")
        ? (date_event = date_e)
        : (date_event = date_event);
    }
    if (date_post) {
      const date_p = new Date(`${date_post}T00:00:00`);
      date_post = !date_post.includes("T")
        ? (date_post = date_p)
        : (date_post = date_post);
    }
    if (themes) event.themes = themes;
    if (formats) event.formats = formats;
    if (notifications) event.notifications = notifications;
    if (title) event.title = title;
    if (description) event.description = description;
    if (date_post) event.date_post = date_post;
    if (date_event) event.date_event = date_event;
    if (tickets) event.tickets = tickets;
    if (location) event.location = location;
    if (price) event.price = price;
    if (members_visibles) event.members_visibles = members_visibles;

    await event.save();
    return event;
  } else return { message: "No access!" };
};
const payment = async (req, res) => {
  const line_items_promises = req.body.cartItems.map(async (item) => {
    const promo = await Promocode.findOneAndDelete({
      users: req.user.id,
      event: item.id,
    }).select("users");
    let price = item.price;
    // 4%
    if (promo) {
      price = price * 0.96;
    }
    return {
      price_data: {
        currency: "uah",
        product_data: {
          name: item.title,
          description: item.description,
          metadata: {
            date: item.date_event,
            id: item.id,
          },
        },
        unit_amount: price * 100,
      },
      quantity: item.quantity,
    };
  });

  const line_items = await Promise.all(line_items_promises);

  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    success_url: `${process.env.BASE_URL}checkout-success`,
    cancel_url: `${process.env.BASE_URL}cart`,
  });
  console.log(session);
  res.send({ url: session.url });
};
const after_buying_action = async (req) => {
  const user = await User.findById(req.user.id);
  let { visible, remind, bought_events } = req.body;

  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  for (let i = 0; i < bought_events.length; i++) {
    const event = await Event.findById(bought_events[i]);
    const company = await Company.findById(event.author);

    const date = event.date_event.toLocaleString("ru-RU", options);

    // после оплаты отправляются билеты по почте и добавляется юзер в мемберы ивента, юзеру зачисляется какой-то промокод со скидкой, -1 билет в счетчике билетов ивента
    mailTransport().sendMail({
      from: company.email,
      to: user.email,
      subject: `Your tickets from "Afisha"`,
      html: `<h1>${user.full_name} bought tickets from "Afisha" on ${event.title}</h1>
        <h2>Starts at ${date}</h2>
        <h2>Address: ${event.location}</h2>
        <h1>Was paid: ${event.price}</h1>`,
    });

    if (event.notifications === true) {
      mailTransport().sendMail({
        from: process.env.USER,
        to: company.email,
        subject: `The new member on your event from "Afisha"`,
        html: `<h1>${user.full_name} bought tickets from "Afisha" on ${event.title}</h1>
        <h2>Starts at ${date}</h2>
        <h2>Address: ${event.location}</h2>
        <h1>Was paid: ${event.price}</h1>`,
      });
    }

    event.tickets = event.tickets - 1;
    await event.save();

    // here made a ticket
    const newTicket = new Ticket({
      visible,
      remind,
      user: req.user.id,
      event: event.id,
    });
    await newTicket.save();
  }

  // Определяем массив
  let promo = await Promocode.find();
  let arr = [];
  for (let i = 0; i < promo.length; i++) {
    arr.push(promo[i].id);
  }
  // Получаем случайный ключ массива
  var rand = Math.floor(Math.random() * arr.length);

  promo = await Promocode.findById(arr[rand]);
  promo.users.push(req.user.id);
  promo.save();
  return { message: "Tickets were sent on your email" };
};
const createComment = async (req) => {
  const { comment } = req.body;
  if (!comment) return res.json({ message: "Comment can not be empty" });
  const newComment = new Comment({
    comment,
    author: req.user.id,
    event: req.params.id,
  });
  await newComment.save();
  return newComment;
};
const getEventComments = async (req) => {
  const eventId = req.params.id;
  const comments = await Comment.find({ event: eventId });
  console.log(comments);
  return comments;
};
const getEventCategory = async (req) => {
  const event = await Event.findById(req.params.id);
  const format = await Format.find();
  const theme = await Theme.find();

  let mas = [];
  for (let i = 0; i < event.formats.length; i++) {
    for (let j = 0; j < format.length; j++) {
      if (event.formats[i].toString() === format[j].id.toString())
        mas.push(format[j]);
    }
  }
  for (let i = 0; i < event.themes.length; i++) {
    for (let j = 0; j < theme.length; j++) {
      if (event.themes[i].toString() === theme[j].id.toString())
        mas.push(theme[j]);
    }
  }

  // const theme = await Promise.all(
  //   event.categories.map((title) => {
  //     return Theme.findById(title);
  //   })
  // );
  // const format = await Promise.all(
  //   event.categories.map((title) => {
  //     return Format.findById(title);
  //   })
  // );

  return { mas };
};

export default {
  getEventById,
  getAllEvents,
  createEvent,
  deleteEvent,
  updateEvent,
  payment,
  after_buying_action,
  createComment,
  getEventComments,
  getEventCategory,
  loadPictures,
};
