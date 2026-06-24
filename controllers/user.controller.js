import Utilisateur from "../models/utilisateur.model.js";
import { ObjectId, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();


const client = new MongoClient(process.env.DB_URL);
const db = client.db();
const collection = db.collection('utilisateurs')


export const getUsers = async (req, res, next) => {

    try {
        const users = await Utilisateur.find();

        if (!users || users.length === 0) {
            res.status(404).json({ success: false, message: "Aucun utilisateur n'a été trouver" });
            next()
        } else {

            res.status(200).json({ success: true, data: users });
        }

    } catch (error) {
        next(error);
    }
};

export const getUser = async (req, res, next) => {

    try {
        if(!req.user) {
            const error = new Error('Non Authentifié.');
            error.statusCode = 401;
            throw error;
        };
        
        const user = await Utilisateur.findById(req.params.id).select({
            email: 1,
            nom: 1,
            emailVerified: 1,
            isActive: 1,
            phone: 1,
            photo: 1,
            role: 1,
            _id: 0
        });

        if (!user) {
            const error = new Error('Utilisateur introuvable.');
            error.statusCode = 404;
            throw error;
        };

        if (!user.isActive) {
            const error = new Error('Utilisateur désactivé.');
            error.statusCode = 403;
            throw error;
        };

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {

        // Vérifie si l'utilisateur connecté est celui qui veut modifier
        if (req.params.id !== req.user.id) {
            const error = new Error("Vous n'êtes pas autorisé à modifier cet utilisateur.");
            error.statusCode = 403;
            throw error;
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            const error = new Error('Le corps de la requête est vide.');
            error.statusCode = 400;
            throw error;
        }


        const champAutorises = ['nom', 'phone', 'photo', 'ville'];
        const updateData = {};

        // ─── Remplir updateData avec les champs autorisés ────  ← manquait
        champAutorises.forEach((champ) => {
            if (req.body[champ] !== undefined) {
                updateData[champ] = req.body[champ];
            }
        });

        // Vérifie qu'il y a au moins un champ à mettre à jour
        if (Object.keys(updateData).length === 0) {
            const error = new Error('Aucun champ valide à mettre à jour.');
            error.statusCode = 400;
            throw error;
        }

        // Met à jour l'utilisateur
        const updatedUser = await Utilisateur.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            {
                returnDocument: 'after',  // new: true,  
                runValidators: true,
            }
        ).select('-password');       // ← select en dehors des options

        if (!updatedUser) {
            const error = new Error('Utilisateur introuvable.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Utilisateur mis à jour avec succès.',
            data: updatedUser
        });

    } catch (error) {
        next(error);
    }
};

export const updateRole = async (req, res, next) => {
    try {
        const { role } = req.body.toLowerCase();
        const rolesAutorises = ['client', 'pharmacien'];

        if (!role || !rolesAutorises.includes(role)) {
            const error = new Error(`Rôle invalide. Valeurs acceptées : ${rolesAutorises.join(', ')}.`);
            error.statusCode = 400;
            throw error;
        }

        const utilisateur = await collection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: { role } },
            { returnDocument: 'after' }
        );

        if (!utilisateur) {
            const error = new Error('Utilisateur introuvable.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: `Rôle mis à jour : ${role}.`,
            data: utilisateur
        });

    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {

        const { id } = req.params;
        const user = await Utilisateur.findOne({ _id: new ObjectId(id) });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        if (user.isActive === false) {
            return res.status(400).json({ message: "Utilisateur déjà supprimé." });
        }

        await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    isActive: false,
                    deletedAt: new Date(),
                },
            }
        );

        const deletedUser = await Utilisateur.findOne({ _id: new ObjectId(id) });

        res.status(200).json({
            success: true,
            message: 'Utilisateur désactivé avec succès.',
            data: deletedUser
        });

    } catch (error) {
        next(error);
    }
};

export const restoreUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await Utilisateur.findOne({ _id: new ObjectId(id) });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        if (user.isActive === true) {
            return res.status(400).json({ message: "Utilisateur déjà actif." });
        }

        await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    isActive: true,
                    restoredAt: new Date(),
                },
            }
        );

        const restoredUser = await Utilisateur.findOne({ _id: new ObjectId(id) });

        res.status(200).json({
            success: true,
            message: 'Utilisateur réactivé avec succès.',
            data: restoredUser
        });


    } catch (error) {
        next(error);
    }
};