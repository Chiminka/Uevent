import Event from "../models/Event.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import promo from "../utils/create_promo.js";
import mailTransport from "../utils/mailTransport.js";
import Stripe from "stripe";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const stripe = Stripe(process.env.STRIPE_KEY);

export class EventController {
  async getEventById(req, res) {
    try {
      const event = await Event.findById({ _id: req.params.id });
      res.json(event);
    } catch (error) {
      res.json({ message: "Getting event error" });
    }
  }
  async getAllEvents(req, res) {
    try {
      const event = await Event.find({ visible: "yes" }).sort("-date_event");
      let arr_event = [];
      for (let i = 0; i < event.length; i++) {
        if (event[i].tickets > 0) arr_event.push(event[i]);
      }
      res.json(arr_event);
    } catch (error) {
      res.json({ message: "Getting event error" });
    }
  }
  async createEvent(req, res) {
    // может только компания
    try {
      const user = await User.findById(req.user.id);
      if (user.role !== "company") {
        res.json({ message: "Access denied" });
        return;
      }

      let {
        notifications,
        title,
        description,
        date_event,
        date_post,
        format,
        tickets,
        price,
        location,
        members_visibles,
      } = req.body;

      if (
        !title ||
        !description ||
        !date_event ||
        !format ||
        !tickets ||
        !location ||
        !price
      )
        return res.json({ message: "Content can not be empty" });

      if (req.files) {
        let fileName = Date.now().toString() + req.files.image.name;
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
        format,
        tickets,
        location,
        img: fileName,
        members_visibles,
        promo_code: promo(),
        author: req.user.id,
      });

      await newEvent.save();
      return res.json(newEvent);
    } catch (error) {
      console.log(error);
      res.json({ message: "Creating event error" });
    }
  }
  async deleteEvent(req, res) {
    try {
      // может только компания, которая создала
      const event = await Event.findById(req.params.id);
      const user = await User.findById(req.user.id);

      if (event.members.length > 0) {
        for (let i = 0; i < event.members.length; i++) {
          const member = await User.findById(event.members[i]);
          const author = await User.findById(event.author);
          mailTransport().sendMail({
            from: author.email,
            to: member.email,
            subject: `Event "${event.title}" was deleted by organizer`,
          });
        }
        if (req.user._id.equals(event.author) && user.role === "company") {
          await Event.findByIdAndDelete(req.params.id);
          return res.json({
            message: "Event was deleted and members were warned",
          });
        } else return res.json({ message: "No access!" });
      } else {
        if (req.user._id.equals(event.author) && user.role === "company") {
          await Event.findByIdAndDelete(req.params.id);
          return res.json({
            message: "Event was deleted",
          });
        } else return res.json({ message: "No access!" });
      }
    } catch (error) {
      console.log(error);
      res.json({ message: "Deleting event error" });
    }
  }
  async updateEvent(req, res) {
    try {
      // может только компания, которая создала
      let {
        notifications,
        title,
        description,
        date_event,
        date_post,
        price,
        format,
        tickets,
        location,
        members_visibles,
      } = req.body;

      const event = await Event.findById(req.params.id);
      const user = await User.findById(req.user.id);

      if (req.user._id.equals(event.author) && user.role === "company") {
        if (req.files) {
          let fileName = Date.now().toString() + req.files.image.name;
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
          for (let i = 0; i < event.members.length; i++) {
            const member = await User.findById(event.members[i]);
            const author = await User.findById(event.author);
            mailTransport().sendMail({
              from: author.email,
              to: member.email,
              subject: `Event "${event.title}" was changed by organizer. Check it on the site`,
            });
          }
        }
        if (date_post) {
          const date_p = new Date(`${date_post}T00:00:00`);
          date_post = !date_post.includes("T")
            ? (date_post = date_p)
            : (date_post = date_post);
        }
        if (notifications) event.notifications = notifications;
        if (title) event.title = title;
        if (description) event.description = description;
        if (date_post) event.date_post = date_post;
        if (date_event) event.date_event = date_event;
        if (format) event.format = format;
        if (tickets) event.tickets = tickets;
        if (location) event.location = location;
        if (fileName) event.img = fileName;
        if (price) event.price = price;
        if (members_visibles) event.members_visibles = members_visibles;
        await event.save();

        return res.json(event);
      } else return res.json({ message: "No access!" });
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating event error" });
    }
  }
  async payment(req, res) {
    try {
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
    } catch (error) {
      console.log(error);
      res.json({ message: "Buying tickets error" });
    }
  }
  async after_buying_action(req, res) {
    try {
      const user = await User.findById(req.user.id);
      let { id } = req.body;
      const event = await Event.findById(id);
      const month = event.date_event.getDate();
      const day = event.date_event.getDay();
      const year = event.date_event.getFullYear();
      const hour = event.date_event.getHours();
      const minutes = event.date_event.getMinutes();
      const date = `${day}.${month}.${year} ${hour}:${minutes}`;
      // после оплаты отправляются билеты по почте и добавляется юзер в мемберы ивента, юзеру зачисляется какой-то промокод со скидкой, -1 билет в счетчике билетов ивента
      mailTransport().sendMail({
        from: process.env.USER,
        to: user.email,
        subject: `Your tickets from "Afisha"`,
        html: `<h1>You bought tickets from "Afisha" on ${event.title}</h1>
        <h2>Starts at ${date}</h2>
        <h2>Address: ${event.location}</h2>
        <h1>Was paid: ${event.price}</h1>`,
      });
      event.members = user._id;
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

      console.log(user.my_promo_codes, event.members);
      await user.save();
      await event.save();
      return res.json({ message: "Tickets were sent on your email" });
    } catch (error) {
      console.log(error);
      res.json({ message: "Sending tickets error" });
    }
  }
  async createComment(req, res) {
    try {
      const { comment } = req.body;
      if (!comment) return res.json({ message: "Comment can not be empty" });
      const newComment = new Comment({
        comment,
        author: req.user.id,
        event: req.params.id,
      });
      await newComment.save();
      res.json(newComment);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong" });
    }
  }
  async getEventComments(req, res) {
    try {
      const event = await Event.findById(req.params.id);
      const eventId = event.id;
      const arr = await Comment.find({ event: { _id: eventId } });
      res.json(arr);
    } catch (error) {
      res.json({ message: "Something gone wrong" });
    }
  }
}
