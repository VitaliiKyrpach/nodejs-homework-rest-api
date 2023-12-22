const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");

const { User, schemas } = require("../../models/user");

const { HttpError, sendEmail } = require("../../helpers");
const { authenticate, upload } = require("../../middlewares");

const { SECRET_KEY, BASE_URL } = process.env;

const avatarsDir = path.join(
	__dirname,
	"../",
	"../",
	"public",
	"avatars"
);

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
		const avatarURL = gravatar.url(email);
		const verificationToken = nanoid();

		const newUser = await User.create({
			...req.body,
			password: hashPassword,
			avatarURL,
			verificationToken,
		});

		const verifyEmail = {
			to: email,
			subject: "Verify email",
			html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click to verify email</a>`,
		};
		await sendEmail(verifyEmail);
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
		if (!user.verify) {
			throw HttpError(401, "Email not verified");
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
router.get("/verify/:verificationToken", async (req, res, next) => {
	try {
		const { verificationToken } = req.params;
		const user = await User.findOne({ verificationToken });
		if (!user) {
			throw HttpError(404, "User not found");
		}
		await User.findByIdAndUpdate(user._id, {
			verify: true,
			verificationToken: null,
		});
		res.json({
			message: "Verification successful",
		});
	} catch (error) {
		next(error);
	}
});
router.post("/verify", async (req, res, next) => {
	try {
		const { error } = schemas.emailSchema.validate(req.body);
		if (error) {
			throw HttpError(400, "Missing required field");
		}
		const { email } = req.body;
		const user = await User.findOne({ email });
		if (!user) {
			throw HttpError(404, "Email not found");
		}
		if (user.verify) {
			throw HttpError(400, "Verification has already been passed");
		}
		const verifyEmail = {
			to: email,
			subject: "Verify email",
			html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click to verify email</a>`,
		};
		await sendEmail(verifyEmail);
		res.json({
			message: "Verification email sent",
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
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
});

router.patch(
	"/avatars",
	authenticate,
	upload.single("avatar"),
	async (req, res, next) => {
		try {
			const { _id } = req.user;
			const { path: tempUpload, originalname } = req.file;
			const filename = `${_id}_${originalname}`;
			const resultUpload = path.join(avatarsDir, filename);
			await fs.rename(tempUpload, resultUpload);
			const img = await Jimp.read(resultUpload);
			img.resize(250, 250);
			img.write(resultUpload);
			const avatarURL = path.join("avatars", filename);
			await User.findByIdAndUpdate(_id, { avatarURL });
			res.json({
				avatarURL,
			});
		} catch (error) {
			next(error);
		}
	}
);

module.exports = router;
