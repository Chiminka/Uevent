import Event from "../models/Event.js";
import schedule from "node-schedule";
import Ticket from "../models/Ticket.js";
import mailTransport from "../utils/mailTransport.js";

import { check_promocode } from "./check_promocode.js";

export const post_it_now = async () => {
  schedule.scheduleJob("*/1 * * * 0-6", async () => {
    const events = await Event.find({ visible: "yes" }).populate("author");

    const date = new Date();
    date.setDate(date.getDate() + 1); // установить следующий день
    const date_remaind = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    ].join("-");

    await check_promocode();

    for (const event of events) {
      if (
        [
          event.date_event.getFullYear(),
          event.date_event.getMonth() + 1,
          event.date_event.getDate(),
        ].join("-") === date_remaind
      ) {
        const tickets = await Ticket.find({
          event: event._id,
          remind: true,
        }).populate("user");

        const sentEmails = {}; // объект для хранения id юзеров, которым уже отправлено письмо

        for (const ticket of tickets) {
          const { user } = ticket;
          if (!sentEmails[user.id]) {
            // проверяем, отправляли ли уже письмо юзеру с таким id
            mailTransport().sendMail({
              from: event.author.email,
              to: user.email,
              subject: `Reminder: event ${event.title} starts tomorrow`,
              html: `<h1>Your event ${event.title} starts tomorrow</h1>`,
            });
            sentEmails[user.id] = true; // сохраняем информацию об отправленном письме
          }
          ticket.remind = false;
          await ticket.save();
        }
      }
    }

    const futureEvents = await Event.find({ visible: "no" });

    for (const event of futureEvents) {
      date.setDate(date.getDate() - 1); // установить предыдущий день
      const date_post = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getUTCHours(),
        date.getMinutes(),
      ].join("-");

      if (
        [
          event.date_post.getFullYear(),
          event.date_post.getMonth() + 1,
          event.date_post.getDate(),
          event.date_post.getUTCHours(),
          event.date_post.getMinutes(),
        ].join("-") === date_post ||
        date > event.date_post
      ) {
        event.visible = "yes";
        await event.save();
      }
    }
  });
};
