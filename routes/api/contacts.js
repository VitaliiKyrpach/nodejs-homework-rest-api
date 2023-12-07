const express = require("express");
const { Contact, schemas } = require("../../models/contact");

const { HttpError } = require("../../helpers");
const { isValidId } = require("../../middlewares");

const router = express.Router();

router.get("/", async (req, res, next) => {
	try {
		const result = await Contact.find();
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
});

router.get("/:contactId", isValidId, async (req, res, next) => {
	try {
		const { contactId } = req.params;
		const result = await Contact.findById(contactId);
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
		const { error } = schemas.addSchema.validate(req.body);
		if (error) {
			throw HttpError(400, "Missing required name field");
		}
		const result = await Contact.create(req.body);
		res.status(201).json(result);
	} catch (error) {
		next(error);
	}
});

router.delete("/:contactId", isValidId, async (req, res, next) => {
	try {
		const { contactId } = req.params;
		const result = await Contact.findByIdAndDelete(contactId);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.status(200).json({ message: "contact deleted" });
	} catch (error) {
		next(error);
	}
});

router.put("/:contactId", isValidId, async (req, res, next) => {
	try {
		const { error } = schemas.addSchema.validate(req.body);
		if (error) {
			throw HttpError(400, "Missing fields");
		}
		const { contactId } = req.params;
		const result = await Contact.findByIdAndUpdate(
			contactId,
			req.body,
			{ new: true }
		);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
});

router.patch(
	"/:contactId/favorite",
	isValidId,
	async (req, res, next) => {
		try {
			const { error } = schemas.updateFavorite.validate(req.body);
			if (error) {
				throw HttpError(400, "Missing field favorite");
			}
			const { contactId } = req.params;
			const result = await Contact.findByIdAndUpdate(
				contactId,
				req.body,
				{ new: true }
			);
			if (!result) {
				throw HttpError(404, "Not found");
			}
			res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}
);

module.exports = router;
