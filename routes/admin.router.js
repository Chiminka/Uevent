import AdminBro from "admin-bro";
import AdminBroExpress from "admin-bro-expressjs";
import AdminBroMongoose from "admin-bro-mongoose";
import mongoose from "mongoose";

AdminBro.registerAdapter(AdminBroMongoose);

const adminBro = new AdminBro({
  databases: [mongoose],
  rootPath: "/admin",
});

const ADMIN = {
  email: process.env.ADMIN_EMAIL || "admin@example.com",
  password: process.env.ADMIN_PASSWORD || "lovejs",
};

const router = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
  cookieName: process.env.ADMIN_COOKIE_NAME || "admin-bro",
  cookiePassword:
    process.env.ADMIN_COOKIE_PASS || "supersecret-and-long-password",
  authenticate: async (email, password) => {
    if (email === ADMIN.email && password === ADMIN.password) return ADMIN;
    return null;
  },
});

export default router;

//admin panel on the http://localhost:3002/admin
