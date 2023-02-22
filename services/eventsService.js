import Event from "../models/Event.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Comment from "../models/Comment.js";
import Ticket from "../models/Ticket.js";

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
            members.push(user);
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
const createEvent = async (id, body, req, userID) => {
  const user = await User.findById(id);
  if (user.role !== "company") {
    return { message: "Access denied" };
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
  } = body;

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
    promo_code: promo(),
    author: userID,
  });

  await newEvent.save();
  return newEvent;
};
const deleteEvent = async (req) => {
  // может только компания, которая создала
  const event = await Event.findById(req.params.id);
  if (event === null) {
    return "this event doesn't exist";
  }
  const eventID = event.id;
  const user = await User.findById(req.user.id);
  const tickets = await Ticket.find({ event: eventID });

  if (tickets.length > 0) {
    const members = [];
    for (let i = 0; i < tickets.length; i++) {
      members.push(tickets[i].user);
      await Ticket.findByIdAndDelete(tickets[i]);
    }
    console.log(members);
    for (let i = 0; i < members.length; i++) {
      const member = await User.findById(members[i]);
      const author = await User.findById(event.author);
      mailTransport().sendMail({
        from: author.email,
        to: member.email,
        subject: `Event "${event.title}" was deleted by organizer`,
      });
    }
    if (req.user._id.equals(event.author) && user.role === "company") {
      await Event.findByIdAndDelete(req.params.id);
      return {
        message: "Event was deleted and members were warned",
      };
    } else return { message: "No access!" };
  } else {
    if (req.user._id.equals(event.author) && user.role === "company") {
      await Event.findByIdAndDelete(req.params.id);
      return {
        message: "Event was deleted",
      };
    } else return { message: "No access!" };
  }
};
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

  const event = await Event.findById(req.params.id);
  if (event === null) {
    return "this event doesn't exist";
  }
  const eventId = event.id;
  const user = await User.findById(req.user.id);

  if (req.user._id.equals(event.author) && user.role === "company") {
    const all_tickets = await Ticket.find({ event: eventId });

    if (all_tickets)
      for (let i = 0; i < all_tickets.length; i++) {
        const member = await User.findById(all_tickets[i].user);
        const author = await User.findById(event.author);
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
const payment = async (req) => {
  const user = await User.findById(req.user.id);
  // тут нужно проверять промо код, если есть, то давать скидку на 4%
  const line_items = req.body.cartItems.map((item) => {
    const event = Event.findById(item.id);
    if (user.my_promo_codes.length > 0) {
      for (let i = 0; i < user.my_promo_codes.length; i++) {
        if (user.my_promo_codes[i] === event.promo_code) {
          let price = item.price - (item.price / 100) * 4;
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
        }
      }
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
        unit_amount: item.price * 100,
      },
    };
  });
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
  let { visible, seat } = req.body;
  const event = await Event.findById(req.params.id);

  const month = event.date_event.getDate();
  const day = event.date_event.getDay();
  const year = event.date_event.getFullYear();
  const hour = event.date_event.getHours();
  const minutes = event.date_event.getMinutes();
  const date = `${day}.${month}.${year} ${hour}:${minutes}`;
  // после оплаты отправляются билеты по почте и добавляется юзер в мемберы ивента, юзеру зачисляется какой-то промокод со скидкой, -1 билет в счетчике билетов ивента
  if (seat) {
    mailTransport().sendMail({
      from: process.env.USER,
      to: user.email,
      subject: `Your tickets from "Afisha"`,
      html: `<h1>${user.full_name} bought tickets from "Afisha" on ${event.title}</h1>
        <h2>Starts at ${date}</h2>
        <h2>Address: ${event.location}. Seat is ${seat}</h2>
        <h1>Was paid: ${event.price}</h1>`,
    });
  } else if (!seat) {
    mailTransport().sendMail({
      from: process.env.USER,
      to: user.email,
      subject: `Your tickets from "Afisha"`,
      html: `<h1>${user.full_name} bought tickets from "Afisha" on ${event.title}</h1>
        <h2>Starts at ${date}</h2>
        <h2>Address: ${event.location}</h2>
        <h1>Was paid: ${event.price}</h1>`,
    });
  }
  // here made a ticket
  const newTicket = new Ticket({
    visible,
    seat,
    user: req.user.id,
    event: req.params.id,
  });
  await newTicket.save();

  event.tickets = event.tickets - 1;

  // Определяем массив
  const events = await Event.find();
  let arr = [];
  for (let i = 0; i < events.length; i++) {
    arr.push(events[i].promo_code);
  }
  // Получаем случайный ключ массива
  var rand = Math.floor(Math.random() * arr.length);
  user.my_promo_codes = arr[rand];

  await user.save();
  await event.save();
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
