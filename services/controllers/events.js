import eventService from "../services/eventsService.js";

export class EventController {
  async getEventById(req, res) {
    try {
      let userID = "";
      if (req.user) userID = req.user._id;
      const getEventById = await eventService.getEventById(req, userID, res);
      res.json(getEventById);
    } catch (error) {
      console.log(error);
      res.json({ message: "Getting event error" });
    }
  }
  async getAllEvents(req, res) {
    try {
      const getAllEvents = await eventService.getAllEvents(req, res);
      res.json(getAllEvents);
    } catch (error) {
      console.log(error);
      res.json({ message: "Getting event error" });
    }
  }
  async createEvent(req, res) {
    // может только компания
    try {
      const createEvent = await eventService.createEvent(req, res);
      res.json(createEvent);
    } catch (error) {
      console.log(error);
      res.json({ message: "Creating event error" });
    }
  }
  async deleteEvent(req, res) {
    try {
      const deleteEvent = await eventService.deleteEvent(req, res);
      res.json(deleteEvent);
    } catch (error) {
      console.log(error);
      res.json({ message: "Deleting event error" });
    }
  }
  async updateEvent(req, res) {
    try {
      const updateEvent = await eventService.updateEvent(req, res);
      res.json(updateEvent);
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating event error" });
    }
  }
  async loadPictures(req, res) {
    try {
      const loadPictures = await eventService.loadPictures(req, res);
      res.json(loadPictures);
    } catch (error) {
      console.log(error);
      res.json({ message: "Updating event error" });
    }
  }
  async payment(req, res) {
    try {
      const payment = await eventService.payment(req, res);
      res.json(payment);
    } catch (error) {
      console.log(error);
      res.json({ message: "Buying tickets error" });
    }
  }
  async webhook(req, res) {
    try {
      const webhook = await eventService.webhook(req, res);
      res.json(webhook);
    } catch (error) {
      console.log(error);
      res.json({ message: "Webhook error" });
    }
  }
  async after_buying_action(req, res) {
    try {
      const after_buying_action = await eventService.after_buying_action(
        req,
        res
      );
      res.json(after_buying_action);
    } catch (error) {
      console.log(error);
      res.json({ message: "Sending tickets error" });
    }
  }
  async createComment(req, res) {
    try {
      const createComment = await eventService.createComment(req, res);
      res.json(createComment);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong" });
    }
  }
  async getEventComments(req, res) {
    try {
      const getEventComments = await eventService.getEventComments(req, res);
      res.json(getEventComments);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong" });
    }
  }
  async getEventCategory(req, res) {
    try {
      const getEventCategory = await eventService.getEventCategory(req, res);
      res.json(getEventCategory);
    } catch (error) {
      console.log(error);
      res.json({ message: "Something gone wrong" });
    }
  }
}
