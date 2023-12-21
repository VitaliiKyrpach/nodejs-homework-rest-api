const nodemailer = require("nodemailer");
require("dotenv").config();

const { META_PASSWORD } = process.env;

const nodemailerConfig = {
	host: "smtp.meta.ua",
	port: 465,
	secure: true,
	auth: {
		user: "vitaliikyrpach@meta.ua",
		pass: META_PASSWORD,
	},
};

const transport = nodemailer.createTransport(nodemailerConfig);

const email = {
	to: "betoh11785@bayxs.com",
	from: "vitaliikyrpach@meta.ua",
	subject: "Test email",
	html: "<p>Test email from main</p>",
};

transport
	.sendMail(email)
	.then(() => console.log("Email send success"))
	.catch((error) => console.log(error.message));
