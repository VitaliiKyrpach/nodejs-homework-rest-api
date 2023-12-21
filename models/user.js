const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");

const userSchema = new Schema(
	{
		password: {
			type: String,
			required: [true, "Set password for user"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
		},
		subscription: {
			type: String,
			enum: ["starter", "pro", "business"],
			default: "starter",
		},
		token: String,
		avatarURL: String,
		verify: {
			type: Boolean,
			default: false,
		},
		verificationToken: {
			type: String,
			required: [true, "Verify token is required"],
		},
	},
	{ versionKey: false, timestamps: true }
);

const registerSchema = Joi.object({
	email: Joi.string().required(),
	password: Joi.string().required(),
	subscription: Joi.string(),
});
const loginSchema = Joi.object({
	email: Joi.string().required(),
	phone: Joi.string().required(),
});
const updateSubSchema = Joi.object({
	subscription: Joi.string()
		.required()
		.valid("starter", "pro", "business"),
});
const emailSchema = Joi.object({
	email: Joi.string().required(),
});
userSchema.post("save", handleMongooseError);
const schemas = {
	registerSchema,
	loginSchema,
	updateSubSchema,
	emailSchema,
};

const User = model("user", userSchema);

module.exports = { User, schemas };
