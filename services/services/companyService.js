import User from "../models/User.js";
import Event from "../models/Event.js";
import jwt from "jsonwebtoken";
import mailTransport from "../utils/mailTransport.js";
import Company from "../models/Company.js";
import Ticket from "../models/Ticket.js";
import promo from "../utils/create_promo.js";
import Promocode from "../models/Promocode.js";
import asyncHandler from "express-async-handler";

import { fileURLToPath } from "url";
import path, { dirname } from "path";
import fs from "fs";
import util from "util";

const mkdir = util.promisify(fs.mkdir);

// если компания удалила себя - оповестить
const deleteCompany = async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (company.admin.toString() === req.user.id.toString()) {
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
    await Promise.all([
      Company.findByIdAndDelete(req.params.id),
      Promocode.findOneAndDelete({ company: req.params.id }),
    ]);
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
  } else {
    return { message: "No access!" };
  }
};
// если компания изменила данные о себе - оповестить
const updateCompany = async (req, res) => {
  const { company_name, email, location, description, my_social_net } =
    req.body;
  const company = await Company.findById(req.params.id);

  if (company.admin.toString() === req.user.id.toString()) {
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

    if (my_social_net) {
      company.social_net = my_social_net;
    }
    if (description) {
      company.description = description;
    }
    if (company_name) {
      company.company_name = company_name;
    }
    if (location) {
      company.location = location;
    }
    if (email && email !== company.email) {
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
      const url = `${process.env.BASE_URL}verify_company/${v_token}`;
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
    return { company };
  } else {
    return { message: "No access!" };
  }
};
const getCompanyEvents = async (req, res) => {
  const page = req.params.page;
  // получить все ивенты компании
  const company = await Company.findById(req.params.id);
  const userId = company.id;
  const events = await Event.find({ author: { _id: userId } }).sort(
    "-date_event"
  );
  const pageSize = 5;
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;
  const pageEvents = events.slice(startIndex, endIndex);
  const totalPages = Math.ceil(events.length / pageSize);

  return { pageEvents, totalPages };
};
const createMyCompany = async (req, res) => {
  const { company_name, email, location, description, my_social_net } =
    req.body;

  if (!location || !company_name || !email) {
    return { message: "Content can not be empty" };
  }

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
    description,
    social_net: my_social_net,
    admin: req.user.id,
  });

  await newCompany.save();

  const user = await User.findById(req.user.id);
  user.companies.push(newCompany.id);
  await user.save();
  console.log(user);

  const v_token = jwt.sign(
    {
      email: newCompany.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

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
  const url = `${process.env.BASE_URL}verify_company/${v_token}`;
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
const getCompanyById = async (req, res) => {
  const company = await Company.findById(req.params.id);
  return company;
};
const updatePromo = async (req, res) => {
  if (req.params.id === null || req.params.id === underfind)
    return { message: "no companies" };

  const promo_code = await Promocode.findOne({ company: req.params.id });
  if (!promo_code) {
    // создаем новый объект Date с текущей датой и временем
    var currentDate = new Date();

    // добавляем 3 недели к текущей дате
    var futureDate = new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000);

    const newPromo = new Promocode({
      company: req.params.id,
      promo_code: promo(),
      expiration_date: futureDate,
    });
    await newPromo.save();

    return {
      message: "Promo was creates",
    };
  } else {
    return {
      message: "Your promo is still alive",
    };
  }
};
const giveSubPromo = async (req, res) => {
  if (req.params.id === null || req.params.id === underfind)
    return { message: "no companies" };
  const company = await Company.findById(req.params.id);

  // фильтруем пользователей, чтобы оставить только тех, у кого есть подписки на компанию
  const usersWithSubscription = await User.find({
    subscriptions_companies: req.params.id,
  });

  const randomUsers = usersWithSubscription
    .slice()
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);
  // получаем 2 случайных элемента из массива usersWithSubscription
  console.log("randomUsers", randomUsers);

  const promocode = await Promocode.findOne({ company: req.params.id });

  if (!promocode) {
    return { message: "Firstly create a new promo" };
  }

  // Для каждого пользователя добавляем промокод, если его нет в массиве промокодов пользователя
  for (const user of randomUsers) {
    if (!promocode.users.includes(user.id)) {
      promocode.users.push(user.id);
      await promocode.save();

      // Отправляем письмо с промокодом пользователю
      mailTransport().sendMail({
        from: process.env.USER,
        to: user.email,
        subject: `You got a promo-code! From site "Let's go together"`,
        html: `<h1>${user.username}, you got a promo-code for events by company ${company.company_name}</h1>
        <h2>Put it in and get 4% discount!</h2>
        <h2>${promocode.promo_code}</h2>
        <h3>Promo code is valid until ${promocode.expiration_date}</h3>`,
      });
    }
  }
  return {
    message: "Promo was sent",
  };
};
const inviteMembers = async (req, res) => {
  const { email } = req.body;

  const new_member = await User.findOne({ email: email });
  if (!new_member) {
    return {
      message: "Sorry, user not founded!",
    };
  }

  const company = await Company.findById(req.params.id);

  const v_token = jwt.sign(
    {
      id_user: new_member._id,
      id_company: req.params.id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  // verification email
  const url = `${process.env.BASE_URL}companies/${v_token}/add-new-member`;
  mailTransport().sendMail({
    from: process.env.USER,
    to: email,
    subject: `Tou have been invited to the company ${company.company_name} by ${req.user.username}. To grant access, follow the link or ignore this message.`,
    html: `<h1>${url}</h1>`,
  });
  ////////////////////////////////////////
  return {
    message: "An Email was sent",
  };
};
const addNewMember = async (req, res) => {
  jwt.verify(
    req.params.token,
    process.env.JWT_SECRET,
    asyncHandler(async (err, decoded) => {
      req.decoded_company = decoded.id_company;
      req.decoded_user = decoded.id_user;
      if (err) {
        return { message: "Forbidden" };
      }
    })
  );
  const user = await User.findById(req.decoded_user);
  if (user.companies.includes(req.decoded_company)) {
    return {
      message: "You are already a member of this company.",
    };
  }
  user.companies.push(req.decoded_company);
  await user.save();
  return {
    message: "You are member now!",
  };
};
const loadPictures = async (req, res) => {
  const company = await Company.findById(req.params.id);

  console.log(company.admin.toString(), req.user.id.toString());
  if (company.admin.toString() !== req.user.id.toString()) {
    return { message: "No access!" };
  }

  let fileName = "";
  if (req.files) {
    fileName = req.files.files.name;
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
    fileName = company.avatar;
  }
  if (fileName) company.avatar = fileName;
  await company.save();
  return { company };
};
const getCompaniesUsers = async (req, res) => {
  const users = await User.find({ companies: { $in: [req.params.id] } });
  return users;
};
const verifyEmail = async (req, res) => {
  jwt.verify(
    req.params.token,
    process.env.JWT_SECRET,
    asyncHandler(async (err, decoded) => {
      console.log(decoded);
      req.decoded = decoded.email;
      if (err) {
        return { message: "Forbidden" };
      }
    })
  );
  const company = await Company.findOne({ email: req.decoded });

  if (!company) {
    return { message: "Sorry, user not found!" };
  }

  if (company.verified) {
    return {
      message: "This account is already verified!",
    };
  }

  company.verified = true;
  await company.save();

  return { message: "Your email is verified" };
};
const getPromo = async (req, res) => {
  const promos = await Promocode.find({ company: req.params.id });
  return { promos };
};

export default {
  getPromo,
  verifyEmail,
  getCompaniesUsers,
  loadPictures,
  getCompanyById,
  createMyCompany,
  deleteCompany,
  updateCompany,
  getCompanyEvents,
  updatePromo,
  giveSubPromo,
  inviteMembers,
  addNewMember,
};
