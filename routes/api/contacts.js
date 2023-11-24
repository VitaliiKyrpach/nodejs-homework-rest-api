const express = require("express");
const contacts = require("../../models/contacts");
const { nanoid } = require("nanoid");
const Joi = require("joi");

const { HttpError } = require("../../helpers");

const router = express.Router();

const schema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string().required(),
	phone: Joi.number().required(),
});

router.get("/", async (req, res, next) => {
	try {
		const result = await contacts.listContacts();
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
});

router.get("/:contactId", async (req, res, next) => {
	try {
		const { id } = req.params;
		const result = await contacts.getContactById(id);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const { error } = schema.validate(req.body);
		if (error) {
			throw HttpError(400, "Missing required name field");
		}
		const body = { id: nanoid(), ...req.body };
		const result = await contacts.addContact(body);
		res.status(201).json(result);
	} catch (error) {
		next(error);
	}
});

router.delete("/:contactId", async (req, res, next) => {
	try {
		const { id } = req.params;
		const result = await contacts.removeContact(id);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.status(200).json({ message: "contact deleted" });
	} catch (error) {
		next(error);
	}
});

router.put("/:contactId", async (req, res, next) => {
	try {
		const { error } = schema.validate(req.body);
		if (error) {
			throw HttpError(400, "Missing fields");
		}
		const { id } = req.params;
		const result = await contacts.updateContact(id, req.body);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
});

module.exports = router;
