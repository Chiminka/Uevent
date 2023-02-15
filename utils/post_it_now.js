import Event from "../models/Event.js";
import schedule from "node-schedule";

export const post_it_now = async () => {
  let date_post = "";
  schedule.scheduleJob("*/1 * * * 0-6", async () => {
    const event = await Event.find();
    const date = new Date();
    for (let i = 0; i < event.length; i++) {
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
