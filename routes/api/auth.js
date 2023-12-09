const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, schemas } = require("../../models/user");

const { HttpError } = require("../../helpers");
const { authenticate } = require("../../middlewares");
const { SECRET_KEY } = process.env;

const router = express.Router();

router.post("/register", async (req, res, next) => {
	try {
		const { error } = schemas.registerSchema.validate(req.body);
		if (error) {
			throw HttpError(400, "Missing required field");
		}
		const { email, password } = req.body;
		const isUser = await User.findOne({ email });
		if (isUser) {
			throw HttpError(409, "Email in use");
		}
		const hashPassword = await bcrypt.hash(password, 10);
		const newUser = await User.create({
			...req.body,
			password: hashPassword,
		});
		res.status(201).json({
			user: {
				email: newUser.email,
				subscription: newUser.subscription,
			},
		});
	} catch (error) {
		next(error);
	}
});

router.post("/login", async (req, res, next) => {
	try {
		const { error } = schemas.registerSchema.validate(req.body);
		if (error) {
			throw HttpError(400, "Missing required field");
		}
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) {
			throw HttpError(401, "Email or password is wrong");
		}
		const passwordCompare = await bcrypt.compare(
			password,
			user.password
		);
		if (!passwordCompare) {
			throw HttpError(401, "Email or password is wrong");
		}

		const payload = {
			id: user._id,
		};
		const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
		await User.findByIdAndUpdate(user._id, { token });
		res.status(200).json({
			token,
			user: {
				email: user.email,
				subscription: user.subscription,
			},
		});
	} catch (error) {
		next(error);
	}
});
router.post("/logout", authenticate, async (req, res, next) => {
	try {
		const { _id } = req.user;
		await User.findByIdAndUpdate(_id, { token: "" });
		res.status(204).json([]);
	} catch (error) {
		next(error);
	}
});
router.get("/current", authenticate, async (req, res, next) => {
	try {
		const { email, subscription } = req.user;
		res.status(200).json({
			email,
			subscription,
		});
	} catch (error) {
		next(error);
	}
});
router.patch("/", authenticate, async (req, res, next) => {
	try {
		const { error } = schemas.updateSubSchema.validate(req.body);
		if (error) {
			throw HttpError(400, "Missing field favorite");
		}
		const { _id } = req.user;
		const result = await User.findByIdAndUpdate(_id, {
			subscription: req.body.subscription,
		});
		console.log(result);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
});

module.exports = router;
