const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
    console.log("inside authentication middleware");
    const authorization = req.headers['authorization'];
    const token = authorization?.startsWith("Bearer ")
        ? authorization.split(" ")[1]
        : null;

    if (!token) {
        return res.status(401).json("Authorization failed...Token is missing!");
    }

    try {
        const jwtResponse = jwt.verify(token, process.env.JWTSECRET);
        req.payload = jwtResponse.userEmail;
        return next();
    } catch (err) {
        return res.status(401).json("invalid token ...Please login");
    }
};

module.exports = authMiddleware;
