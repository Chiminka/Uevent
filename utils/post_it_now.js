import Event from "../models/Event.js";
import User from "../models/User.js";
import schedule from "node-schedule";
import Ticket from "../models/Ticket.js";
import mailTransport from "../utils/mailTransport.js";
import Company from "../models/Company.js";

import { check_promocode } from "./check_promocode.js";

export const post_it_now = async () => {
  let date_post = "";
  schedule.scheduleJob("*/1 * * * 0-6", async () => {
    const event = await Event.find();

    let date = new Date();
    date.setDate(date.getDate() + 1); // установить следующий день
    const date_remaind = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    ].join("-");

    check_promocode();

    for (let i = 0; i < event.length; i++) {
      if (event[i].visible === "yes") {
        if (
          [
            event[i].date_event.getFullYear(),
            event[i].date_event.getMonth() + 1,
            event[i].date_event.getDate(),
          ].join("-") === date_remaind
        ) {
          const author = await Company.findById(event[i].author);
          let this_event = event[i]._id;
          const tickets = await Ticket.find();
          for (let j = 0; j < tickets.length; j++) {
            if (
              tickets[j].event.toString() === this_event.toString() &&
              tickets[j].remind === false
            ) {
              const user = await User.findById(tickets[j].user);
              mailTransport().sendMail({
                from: author.email,
                to: user.email,
                subject: `Reminder: event ${event[i].title} starts tomorrow`,
                html: `<h1>Your event ${event[i].title} starts tomorrow</h1>`,
              });
              tickets[j].remind = true;
              tickets[j].save();
            }
          }
        }
      }

      if (event[i].visible === "no") {
        date.setDate(date.getDate() - 1); // установить следующий день
        date_post = [
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate(),
          date.getUTCHours(),
          date.getMinutes(),
        ].join("-");

        console.log(
          new Date(date.toISOString()),
          new Date(event[i].date_post.toISOString())
        );

        if (
          [
            event[i].date_post.getFullYear(),
            event[i].date_post.getMonth() + 1,
            event[i].date_post.getDate(),
            event[i].date_post.getUTCHours(),
            event[i].date_post.getMinutes(),
          ].join("-") === date_post ||
          new Date(date.toISOString()) >
            new Date(event[i].date_post.toISOString())
        ) {
          event[i].visible = "yes";
          await event[i].save();
        }
      }
    }
  });
};
