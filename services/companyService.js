import User from "../models/User.js";
import Event from "../models/Event.js";
import jwt from "jsonwebtoken";
import mailTransport from "../utils/mailTransport.js";
import Company from "../models/Company.js";

// если компания удалила себя - оповестить
const deleteCompany = async (req, res) => {
  const company = await Company.findById(req.params.id);
  const user = await User.findById(req.user.id);

  if (user.companies.includes(company.id)) {
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
          subject: `Company ${company.company_name} no longer in service. The company has been deleted.`,
        });
      }
    await Company.findByIdAndDelete(req.params.id);
    const companyID = req.params.id;
    await User.updateOne(
      { companies: companyID },
      { $pull: { companies: companyID } }
    );
    const events = await Event.find({ author: companyID });
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
        if (users[i].subscriptions)
          for (let j = 0; j < users[i].subscriptions.length; j++) {
            if (
              users[i].subscriptions[j].toString() === company.id.toString()
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
      // await company.save();
      return {
        company,
        message: "An Email sent to your account please verify",
      };
    }
    // await company.save();
    return company;
  } else return { message: "No access!" };
};
const getCompanyEvents = async (req) => {
  // получить все ивенты компании
  const company = await Company.findById(req.params.id);
  const userId = company.id;
  const events = await Event.find({ author: { _id: userId } })
    .sort("-date_event")
    .limit(5);
  return events;
};
const createMyCompany = async (req) => {
  const { company_name, email, location } = req.body;

  if (!location || !company_name || !email)
    return { message: "Content can not be empty" };

  // const emailExist = await User.findOne({ email });
  // console.log(emailExist);

  // if (emailExist) {
  //   return {
  //     message: "These username or email already are taken",
  //   };
  // }

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
