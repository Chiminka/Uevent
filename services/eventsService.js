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

const stripe = Stripe(process.env.STRIPE_KEY);
const mkdir = util.promisify(fs.mkdir);

const getEventById = async (id, userID) => {
  const event = await Event.findById(id);

  let idAuthor = event.author.toString();
  const author = await Company.findById(idAuthor);
  event.author = author;

  const all_events = await Event.find();

  let similar_events = [];

  var intersect = function (arr1, arr2) {
    return arr1.filter(function (n) {
      return arr2.indexOf(n) !== -1;
    });
  };

  for (let i = 0; i < all_events.length; i++) {
    if (all_events[i].themes || all_events[i].formats) {
      if (
        (intersect(event.themes, all_events[i].themes).length > 0 ||
          intersect(event.formats, all_events[i].formats).length > 0) &&
        event.id !== all_events[i].id
      ) {
        let idAuthor = all_events[i].author.toString();
        const author = await Company.findById(idAuthor);
        all_events[i].author = author;
        const themes = await Theme.find({
          _id: { $in: all_events[i].themes },
        });
        all_events[i].themes = themes;
        const formats = await Format.find({
          _id: { $in: all_events[i].formats },
        });
        all_events[i].formats = formats;
        similar_events.push(all_events[i]);
      }
    }
  }

  const members = [];

  let ticket = await Ticket.find({ event: id });
  for (let i = 0; i < ticket.length; i++)
    if (event.members_visibles === "everyone") {
      if (ticket[i].visible === "yes") {
        let user = await User.findById(ticket[i].user);
        members.push(user);
      }
    } else {
      for (let j = 0; j < ticket.length; j++)
        if (userID.toString() === ticket[j].user.toString()) {
          if (ticket[i].visible === "yes") {
            let user = await User.findById(ticket[i].user);
            if (!members.some((m) => m.id === user.id)) {
              members.push(user);
            }
          }
        }
    }

  const themes = await Theme.find({ _id: { $in: event.themes } });
  event.themes = themes;
  const formats = await Format.find({ _id: { $in: event.formats } });
  event.formats = formats;

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
    if (users[i].subscriptions)
      for (let j = 0; j < users[i].subscriptions.length; j++) {
        if (users[i].subscriptions[j].toString() === company.id.toString()) {
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
    const users = await User.find();
    let arr_subs = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i].subscriptions)
        for (let j = 0; j < users[i].subscriptions.length; j++) {
          if (
            (users[i].subscriptions[j].toString() === company.id.toString() ||
              users[i].subscriptions[j].toString() === event.id.toString()) &&
            !arr_subs.includes(users[i])
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
          subject: `Company ${company.company_name} deleted event "${event.title}". Check it on the site`,
        });
      }
    if (tickets.length > 0) {
      const members = [];
      for (let i = 0; i < tickets.length; i++) {
        members.push(tickets[i].user);
        await Ticket.findByIdAndDelete(tickets[i]);
      }
      console.log(members);
      for (let i = 0; i < members.length; i++) {
        const member = await User.findById(members[i]);
        const author = await Company.findById(event.author);
        mailTransport().sendMail({
          from: author.email,
          to: member.email,
          subject: `Event "${event.title}" was deleted by organizer`,
        });
      }
      await Event.findByIdAndDelete(req.params.eventId);
      await Promocode.findOneAndDelete({ event: req.params.eventId });
      return {
        message: "Event was deleted and members were warned",
      };
    } else {
      await Event.findByIdAndDelete(req.params.eventId);
      await Promocode.findOneAndDelete({ event: req.params.eventId });
      return {
        message: "Event was deleted",
      };
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

  if (
    (themes.length > 1 || formats.length > 1) &&
    (themes.includes("64269fd38d89323058b7a309") ||
      formats.includes("64269fe08d89323058b7a30f"))
  )
    return { message: "there is mustn't be anything else if it has 'none'" };

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
      if (users[i].subscriptions)
        for (let j = 0; j < users[i].subscriptions.length; j++) {
          if (
            (users[i].subscriptions[j].toString() === company.id.toString() ||
              users[i].subscriptions[j].toString() === event.id.toString()) &&
            !arr_subs.includes(users[i])
          ) {
            arr_subs.push(users[i]);
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
  const line_items = await Promise.all(
    req.body.cartItems.map(async (item) => {
      const promo = await Promocode.find({
        users: req.user.id,
        event: item.id,
      });
      let price = item.price;
      if (promo) {
        price = price - (price / 100) * 4;
        await Promocode.updateOne(
          { _id: promo._id },
          { $pull: { users: req.user.id } }
        );
      }
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
            images: [item.img],
            description: item.description,
            date: item.date_event,
            metadata: {
              id: item.id,
            },
          },
          unit_amount: price * 100,
        },
        quantity: item.cartQuantity,
      };
    })
  );
  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    success_url: `${process.env.BASE_URL}/checkout-success`,
    cancel_url: `${process.env.BASE_URL}/cart`,
  });
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
