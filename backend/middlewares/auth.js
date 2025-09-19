// Importar módulos
const jwt = require("jwt-simple");
const moment = require("moment");

// Clave secreta desde .env (o fallback)
const claveSecreta = process.env.JWT_SECRET || "mi_secreto_super_seguro";

// Middleware de autenticación
exports.auth = (req, res, next) => {
    // Comprobar si existe cabecera de auth
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "error",
            message: "La petición no tiene la cabecera de autenticación"
        });
    }

    // Limpiar token (quitar 'Bearer ' si existe)
    let token = req.headers.authorization.replace("Bearer ", "").replace(/['"]+/g, "");

    try {
        let payload = jwt.decode(token, claveSecreta);

        // Comprobar expiración
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                status: "error",
                message: "Token expirado"
            });
        }

        // Agregar datos del usuario a la request
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
