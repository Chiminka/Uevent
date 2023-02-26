import Event from "../models/Event.js";
import User from "../models/User.js";
import schedule from "node-schedule";
import Ticket from "../models/Ticket.js";
import mailTransport from "../utils/mailTransport.js";

export const post_it_now = async () => {
  let date_post = "";
  schedule.scheduleJob("*/1 * * * 0-6", async () => {
    const event = await Event.find();
    const date = new Date();

    for (let i = 0; i < event.length; i++) {
      if (event[i].visible === "yes") {
        let date_remaind = [
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate() + 1,
        ].join("-");
        if (
          [
            event[i].date_event.getFullYear(),
            event[i].date_event.getMonth() + 1,
            event[i].date_event.getDate(),
          ].join("-") === date_remaind
        ) {
          const user_author = await User.findById(event[i].author);
          let this_event = event[i]._id;
          const tickets = await Ticket.find();
          for (let i = 0; i < tickets.length; i++) {
            if (
              tickets[i].event.toString() === this_event.toString() &&
              tickets[i].remind === false
            ) {
              const user = await User.findById(tickets[i].user);
              mailTransport().sendMail({
                from: user_author.email,
                to: user.email,
                subject: `Reminder: event ${event[i].name} starts tomorrow`,
                html: `<h1>Your event ${event[i].name} starts tomorrow</h1>`,
              });
              tickets[i].remind = true;
              tickets[i].save();
            }
          }
        }
      }

      if (event[i].visible === "no") {
        date_post = [
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate(),
          date.getUTCHours(),
          date.getMinutes(),
        ].join("-");
        if (
          [
            event[i].date_post.getFullYear(),
            event[i].date_post.getMonth() + 1,
            event[i].date_post.getDate(),
            event[i].date_post.getUTCHours(),
            event[i].date_post.getMinutes(),
          ].join("-") === date_post
        ) {
          event[i].visible = "yes";
          await event[i].save();
        }
      }
    }
  });
};
