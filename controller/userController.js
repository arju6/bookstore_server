const users = require("../Models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
//register logic

exports.registerController = async (req, res) => {
    console.log("registration logic");

    const { username, email, password } = req.body;
    //check email is in db
    const existingUser = await users.findOne({ email });
    if (existingUser) {
        res.status(409).json("User already exist!......please login");
    } else {
        const encryptedPassword = await bcrypt.hash(password, 10);
        const newUser = await users.create({ username, email, password: encryptedPassword });
        res.status(200).json(newUser);
    }
};

//login logic

exports.loginController = async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await users.findOne({ email });

    if (existingUser) {
        const isPswdMatch = await bcrypt.compare(password, existingUser.password);
        if (isPswdMatch) {
            const token = jwt.sign({ userEmail: email, role: existingUser.role }, process.env.JWTSECRET);
            res.status(200).json({ user: existingUser, token });
        } else {
            res.status(409).json("invalid email..please register");
        }
    } else {
        res.status(409).json("invalid email..please register");
    }
};

//google login logic

exports.googleLogin = async (req, res) => {
    console.log("inside google login");

    const { username, email, password, picture } = req.body;
    let existingUser = await users.findOne({ email });

    if (existingUser) {
        const isGooglePicture = /^https?:\/\/[^/]*googleusercontent\.com\//i.test(existingUser.picture || "");
        if (picture && (!existingUser.picture || isGooglePicture) && existingUser.picture !== picture) {
            existingUser = await users.findByIdAndUpdate(
                existingUser._id,
                { picture },
                { new: true },
            );
        }
        const token = jwt.sign({ userEmail: existingUser.email, role: existingUser.role }, process.env.JWTSECRET);
        res.status(200).json({ user: existingUser, token });
    } else {
        const encryptedPassword = await bcrypt.hash(password, 10);
        const newUser = await users.create({
            username,
            email,
            password: encryptedPassword,
            picture,
        });
        const token = jwt.sign({ userEmail: newUser.email, role: newUser.role }, process.env.JWTSECRET);
        res.status(200).json({ user: newUser, token });
    }
};

exports.userEditController = async (req, res) => {
    console.log("inside user edit");
    const { username, picture, password, bio } = req.body;
    const { id } = req.params;
    console.log(req.file);
    const updatedFile = req.file ? req.file.filename : picture;
    // console.log(req.payload);
    if (password != "") {
        const encryptedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await users.findByIdAndUpdate(
            { _id: id },
            { username, password: encryptedPassword, bio, picture: updatedFile },
            { new: true },
        );
        return res.status(200).json(updatedUser);
    } else {
        const updatedUser = await users.findByIdAndUpdate(
            { _id: id },
            { username, bio, picture: updatedFile },
            { new: true },
        );
        return res.status(200).json(updatedUser);
    }
};

exports.getAllUserController = async (req, res) => {
    const allUsers = await users.find().select("-password");
    res.status(200).json(allUsers);
};