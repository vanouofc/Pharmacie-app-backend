import { auth } from "../auth.js";

export const requireSession = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session) {
            return res.status(401).json({ message: "Non authentifié." });
        }

        req.user = session.user;
        req.session = session.session;
        next();

    } catch (error) {
        next(error);
    }
};