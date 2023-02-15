// import { Router } from "express";
// import Stripe from "stripe";
// import dotenv from "dotenv";

// dotenv.config();
// const stripe = Stripe(process.env.STRIPE_KEY);

// const router = new Router();

// router.post("/create-checkout-session", async (req, res) => {
//   const line_items = req.body.cartItems.map((item) => {
//     return {
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: item.title,
//           images: [item.img],
//           description: item.description,
//           date: item.date_event,
//           metadata: {
//             id: item.id,
//           },
//         },
//         unit_amount: item.price * 100,
//       },
//     };
//   });
//   const session = await stripe.checkout.sessions.create({
//     line_items,
//     mode: "payment",
//     success_url: `${process.env.BASE_URL}/checkout-success`,
//     cancel_url: `${process.env.BASE_URL}/cart`,
//   });

//   res.send({ url: session.url });
// });

// export default router;
