const jwt = require("jwt-simple");
const moment = require("moment");

const claveSecreta = process.env.JWT_SECRET || "mi_secreto_super_seguro";

/*------------------------------------------------------------------------------------*/
exports.auth = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "error",
            message: "La petición no tiene la cabecera de autenticación"
        });
    }

    let token = req.headers.authorization.replace("Bearer ", "").replace(/['"]+/g, "");

    try {
        let payload = jwt.decode(token, claveSecreta);

        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                status: "error",
                message: "Token expirado"
            });
        }

        req.user = payload;
        next();

    } catch (error) {
        return res.status(401).send({
            status: "error",
            message: "Token inválido",
            error: error.message
        });
    }
};
