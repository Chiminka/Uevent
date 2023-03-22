import Promocode from "../models/Promocode.js";

export const check_promocode = async () => {
  const date = new Date();
  const currentDate = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  ].join("-");

  const promo = await Promocode.find();

  for (let i = 0; i < promo.length; i++) {
    const formattedDate = [
      promo[i].expiration_date.getFullYear(),
      promo[i].expiration_date.getMonth() + 1,
      promo[i].expiration_date.getDate(),
    ].join("-");

    if (formattedDate.toString() === currentDate.toString()) {
      await Promocode.findByIdAndDelete(promo[i]._id);
    }
  }
};
