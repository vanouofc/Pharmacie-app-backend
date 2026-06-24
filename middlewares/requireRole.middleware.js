import { auth } from "../auth.js";

export const requireRole = (...roles) => {
    return async (req, res, next) => {
        try {
            const session = await auth.api.getSession({
                headers: req.headers,
            });

            if (!session) {
                return res.status(401).json({ message: "Non authentifié." });
            };

            if (!roles.includes(session.user.role)) {
                return res.status(403).json({
                    message: `Accès refusé. Rôle requis : ${roles.join(" ou ")}.`,
                    code: "INSUFFICIENT_ROLE"
                });
            };

            req.user = session.user;
            req.session = session.session;
            next();

        } catch (error) {
            next(error);
        }
    };
};