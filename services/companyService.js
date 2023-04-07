import User from "../models/User.js";
import Event from "../models/Event.js";
import jwt from "jsonwebtoken";
import mailTransport from "../utils/mailTransport.js";
import Company from "../models/Company.js";
import Ticket from "../models/Ticket.js";
import promo from "../utils/create_promo.js";

// если компания удалила себя - оповестить
const deleteCompany = async (req, res) => {
  const company = await Company.findById(req.params.id);
  const user = await User.findById(req.user.id);

  if (user.companies.includes(company.id)) {
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
          subject: `Company ${company.company_name} no longer in service. The company has been deleted.`,
        });
      }
    await Company.findByIdAndDelete(req.params.id);
    const companyID = req.params.id;
    const events = await Event.find({ author: companyID });

    for (let i = 0; i < events.length; i++) {
      await Ticket.findOneAndDelete({ event: events[i].id });
    }
    // удаление айди компаний и ивентов из юзера
    await User.updateOne(
      { companies: companyID },
      {
        $pull: {
          subscriptions_companies: companyID,
          subscriptions_events: { $in: events.map((event) => event.id) },
          companies: companyID,
        },
      }
    );
    for (let i = 0; i < events.length; i++) {
      await Event.findOneAndDelete({ author: events[i].author });
    }
    return { message: "Company was deleted" };
  } else return { message: "No access!" };
};
// если компания изменила данные о себе - оповестить
const updateCompany = async (req) => {
  const { company_name, email, location } = req.body;
  const company = await Company.findById(req.params.id);
  const user = await User.findById(req.user.id);

  if (user.companies.includes(company.id)) {
    if (company_name || location) {
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
            subject: `The company ${company.company_name} has been changed.`,
          });
        }
    }

    if (company_name) {
      company.company_name = company_name;
    }
    if (location) {
      company.location = location;
    }
    if (email) {
      var validRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

      if (!email.match(validRegex)) {
        return {
          message: "Email isn't valid",
        };
      }
      company.email = email;
      company.verified = false;
      const v_token = jwt.sign(
        {
          email: company.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );

      // verification email
      const url = `${process.env.BASE_URL}verify/${v_token}`;
      mailTransport().sendMail({
        from: process.env.USER,
        to: company.email,
        subject: "Verify your email account",
        html: `<h1>${url}</h1>`,
      });
      await company.save();
      return {
        company,
        message: "An Email sent to your account please verify",
      };
    }
    await company.save();
    return company;
  } else return { message: "No access!" };
};
const getCompanyEvents = async (req) => {
  const page = req.body;
  // получить все ивенты компании
  const company = await Company.findById(req.params.id);
  const userId = company.id;
  const events = await Event.find({ author: { _id: userId } }).sort(
    "-date_event"
  );
  const pageSize = 10;
  const startIndex = (page.page - 1) * pageSize;
  const endIndex = page.page * pageSize;
  const pageEvents = events.slice(startIndex, endIndex);
  const totalPages = Math.ceil(events.length / pageSize);

  return { pageEvents, totalPages };
};
const createMyCompany = async (req) => {
  const { company_name, email, location } = req.body;

  if (!location || !company_name || !email)
    return { message: "Content can not be empty" };

  var validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  if (!email.match(validRegex)) {
    return {
      message: "Email isn't valid",
    };
  }

  const newCompany = new Company({
    company_name,
    email,
    location,
  });

  await newCompany.save();
  const v_token = jwt.sign(
    {
      email: newCompany.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  const user = await User.findById(req.user.id);
  user.companies.push(newCompany.id);
  user.save();

  // создаем новый объект Date с текущей датой и временем
  var currentDate = new Date();

  // добавляем 3 недели к текущей дате
  var futureDate = new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000);

  const newPromo = new Promocode({
    company: newCompany.id,
    promo_code: promo(),
    expiration_date: futureDate,
  });

  await newPromo.save();

  // verification email
  const url = `${process.env.BASE_URL}verify/${v_token}`;
  mailTransport().sendMail({
    from: process.env.USER,
    to: newCompany.email,
    subject: "Verify your email account",
    html: `<h1>${url}</h1>`,
  });
  ////////////////////////////////////////
  return {
    newCompany,
    message: "An Email sent to your account please verify",
  };
};
const getCompanyById = async (req) => {
  const company = await Company.findById(req.params.id);
  return company;
};

export default {
  getCompanyById,
  createMyCompany,
  deleteCompany,
  updateCompany,
  getCompanyEvents,
};
