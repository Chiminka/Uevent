import Event from "../models/Event.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
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

const stripe = Stripe(process.env.STRIPE_KEY);

const getEventById = async (id, userID) => {
  const event = await Event.findById(id);

  const all_events = await Event.find();
  let similar_events = [];

  var intersect = function (arr1, arr2) {
    return arr1.filter(function (n) {
      return arr2.indexOf(n) !== -1;
    });
  };

  for (let i = 0; i < all_events.length; i++) {
    if (all_events[i].categories) {
      if (
        intersect(event.categories, all_events[i].categories).length > 0 &&
        event.id !== all_events[i].id
      ) {
        similar_events.push(all_events[i]);
      }
    }
  }

  const members = [];

  let ticket = await Ticket.findOne({ event: id });
  if (ticket !== null) {
    if (event.members_visibles === "everyone") {
      if (ticket.visible === "yes") {
        let user = await User.findById(ticket.user);
        members.push(user);
      }
    } else {
      let tickets = await Ticket.find();
      for (let i = 0; i < tickets.length; i++) {
        if (userID.toString() === tickets[i].user.toString()) {
          if (ticket.visible === "yes") {
            let user = await User.findById(ticket.user);
            if (!members.some((m) => m.id === user.id)) {
              members.push(user);
            }
          }
        }
      }
    }
  }

  return { event, similar_events, members };
};
const getAllEvents = async (req) => {
  const { categoryType } = req.body;
  let event = "";

  switch (categoryType) {
    case "format": {
      const result = await format_sort();
      event = result;
      break;
    }
    case "themes": {
      const result = await themes_sort();
      event = result;
      break;
    }
    default: {
      const result = await date_sort();
      event = result;
      break;
    }
  }

  console.log(event); // здесь будет значение, возвращаемое промисом

  let arr_event = [];
  // здесь находятся ивенты, у которых есть еще билеты
  for (let i = 0; i < event.length; i++) {
    if (event[i].tickets > 0) arr_event.push(event[i]);
  }
  return arr_event;
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
    categories,
    location,
    members_visibles,
  } = req.body;

  if (
    !title ||
    !description ||
    !date_event ||
    !tickets ||
    !location ||
    !categories ||
    !price
  )
    return { message: "Content can not be empty" };

  let fileName = "";
  if (req.files) {
    fileName = Date.now().toString() + req.files.image.name;
    const __dirname = dirname(fileURLToPath(import.meta.url));
    req.files.image.mv(path.join(__dirname, "..", "uploads", fileName));
  }

  if (fileName.length < 1) {
    fileName =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw-ByquDvpBITEAHnGNeqUyQGw7KX3gqz3A5vQyICAV67mzUB2G8HECVilUr521eXJx04&usqp=CAU";
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
    categories: categories,
    img: fileName,
    members_visibles,
    author: company.id,
  });

  await newEvent.save();

  // создаем новый объект Date с текущей датой и временем
  var currentDate = new Date();

  // добавляем 3 недели к текущей дате
  var futureDate = new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000);
  console.log(futureDate);

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
    categories,
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
    let fileName = "";

    if (req.files) {
      fileName = Date.now().toString() + req.files.image.name;
      const __dirname = dirname(fileURLToPath(import.meta.url));
      req.files.image.mv(path.join(__dirname, "..", "uploads", fileName));
    }

    if (fileName.length < 1) {
      fileName = event.img;
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
    if (categories) event.categories = categories;
    if (notifications) event.notifications = notifications;
    if (title) event.title = title;
    if (description) event.description = description;
    if (date_post) event.date_post = date_post;
    if (date_event) event.date_event = date_event;
    if (tickets) event.tickets = tickets;
    if (location) event.location = location;
    if (fileName) event.img = fileName;
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
  const list = await Promise.all(
    event.categories.map((title) => {
      return Category.findById(title);
    })
  );
  return list;
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
};
