const nodemailer = require("nodemailer");
require("dotenv").config();

const { BREVO_PASS, BREVO_LOGIN } = process.env;

const nodemailerConfig = {
	host: "smtp-relay.brevo.com",
	port: 587,
	auth: {
		user: BREVO_LOGIN,
		pass: BREVO_PASS,
	},
};

const transport = nodemailer.createTransport(nodemailerConfig);

const sendEmail = async (data) => {
	const email = {
		...data,
		from: BREVO_LOGIN,
	};
	console.log(email);
	await transport.sendMail(email);
	return true;
};

module.exports = sendEmail;
