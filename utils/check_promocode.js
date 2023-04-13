import Promocode from "../models/Promocode.js";

export const check_promocode = async () => {
  const promo = await Promocode.find();
  const currentDate = new Date();
  for (let i = 0; i < promo.length; i++) {
    const expirationDate = new Date(promo[i].expiration_date);
    if (expirationDate <= currentDate) {
      console.log(promo[i].expiration_date);
      await Promocode.findByIdAndDelete(promo[i]._id);
    }
  }
};
