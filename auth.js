import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import { sendEmail } from "./controllers/mail.controller.js";
import { emailOTP, admin } from "better-auth/plugins";

dotenv.config({ quiet: true });

const client = new MongoClient(process.env.DB_URL);
const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db),

    trustedOrigins: ["*"], // <----- URL frontend
    baseURL: process.env.BETTER_AUTH_URL,

    // Gestion des sessions
    session: {
        expiresIn: 60 * 60 * 48,
        updateAge: 60 * 60 * 24,
    },

    // ─── Email + Mot de passe ────────────────────────────────
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,

        revokeSessionsOnPasswordReset: true,    //Revoquer toutes les autres sessions apres reinitiaisation.
        resetPasswordTokenExpiresIn: 60 * 10,   //Duree du token.
        sendResetPassword: async ({ user, url }) => {
            void sendEmail({
                to: user.email,
                subject: "Reset your password",
                html: `
                Bonjour <strong>${user.nom || user.name}</strong>,<br><br>
                Vous avez demandé à réinitialiser votre mot de passe sur <strong>PharmOnline</strong>.<br><br>
                Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :<br><br>
                <a href="${url}" style="background-color:#4CAF50; color:white; padding:12px 24px; text-decoration:none; border-radius:5px; display:inline-block;">
                    Réinitialiser mon mot de passe
                </a><br><br>
                Ce lien est valable pendant <strong>10 minutes</strong>.<br><br>
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                Votre mot de passe restera inchangé.<br><br>
                Cordialement,<br>
                <strong>L'équipe PharmOnline</strong>
            `
            });
        },
    },

    // ─── Vérification email ──────────────────────────────────  ← sorti de emailAndPassword
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            void sendEmail({
                to: user.email,
                subject: "Vérifiez votre adresse email",
                html: `Bonjour ${user.name},<br><br>
                Merci d'avoir créé un compte sur <strong>PharmOnline</strong> !<br><br>
                Pour finaliser votre inscription et activer votre compte, veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :<br><br>
                <a href="${url}" style="background-color:#4CAF50; color:white; padding:12px 24px; text-decoration:none; border-radius:5px; display:inline-block;">Confirmer mon adresse email</a><br><br>
                Ce lien est valable pendant <strong>une heure</strong>.<br><br>
                Si vous n'êtes pas à l'origine de cette création de compte, vous pouvez ignorer cet email.<br><br>
                À très bientôt sur PharmOnline !<br><br>
                Cordialement,<br>
                <strong>L'équipe PharmOnline</strong>`,
            });
        },
    },

    // ─── Plugins ─────────────────────────────────────────────  ← sorti de emailAndPassword
    plugins: [
        emailOTP({
            otpLength: 6,
            expiresIn: 60 * 10,
            async sendVerificationOTP({ email, otp, type }) {
                const subjects = {
                    "sign-in": "Code de connexion",
                    "email-verification": "Vérification de votre email",
                    "forget-password": "Réinitialisation du mot de passe",
                };

                void sendEmail({
                    to: email,
                    subject: subjects[type] || "Votre code",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Votre code de vérification</h2>
                            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4CAF50;">
                                ${otp}
                            </p>
                            <p>Ce code expire dans 10 minutes.</p>
                            <p style="color: #888; font-size: 12px;">
                                Si vous n'avez pas demandé ce code, ignorez cet email.
                            </p>
                        </div>
                    `,
                });
            },
        }),

        admin(),
    ],

    // Filtrer les  pour la creation de session.
    databaseHooks: {
        session: {
            create: {
                before: async (session) => {
                    // Récupérer l'utilisateur depuis la base
                    const utilisateur = await db
                        .collection("utilisateurs")
                        .findOne({ _id: new ObjectId(session.userId) });

                    // Bloquer la création de session si supprimé
                    if (!utilisateur || utilisateur.isActive === false) {
                        throw new Error("Ce compte a été désactivé.");
                    }

                    return { data: session };
                },
            },
        },
    },

    // ─── Modèle utilisateur ───────────────────────────────────  ← sorti de emailAndPassword
    user: {
        modelName: "utilisateurs",
        deleteUser: {enabled: true},
        fields: {
            name: "nom",
        },
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "Client",
                input: false,
            },
            phone: {
                type: "string",
                required: true,
            },
            photo: {
                type: "string", // ← corrigé : "string" au lieu de String
            },
            isActive: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: false,
            },
            deletedAt: {
                type: "date",
                required: false,
                defaultValue: null,
                input: false,
            },
            restoredAt: {
                type: "date",
                required: false,
                defaultValue: null,
                input: false,
            },
        },
    },
});