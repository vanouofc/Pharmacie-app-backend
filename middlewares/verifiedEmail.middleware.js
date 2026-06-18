import { auth } from "../auth.js";

export const verifiedEmail = async (req, res, next) => {
    
    const session = await auth.api.getSession({
        headers: req.headers,
    });

    if (!session) {
        return res.status(401).json({ message: "Non authentifié." });
    }

    if (!session.user.emailVerified) {
        return res.status(403).json({ 
            message: "Veuillez vérifier votre adresse email avant de continuer.",
            code: "EMAIL_NOT_VERIFIED"
        });
    }

    req.user = session.user;
    req.session = session.session;
    next();
};