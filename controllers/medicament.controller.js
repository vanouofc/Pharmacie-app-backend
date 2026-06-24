import Medicament from "../models/medicament.model.js";
import { ObjectId, MongoClient } from "mongodb";
import dotenv from "dotenv";
import Pharmacie from "../models/pharmacie.model.js";

dotenv.config();

const client = new MongoClient(process.env.DB_URL);
const db = client.db();
const collection = db.collection("medicaments");


export const createMedicament = async (req, res, next) => {
    try {
        const { nom, description, categorie, alternatives, dosage } = req.body;

        const existMedicament = await Medicament.findOne({ nom: nom, dosage: dosage });

        if (existMedicament) {
            return res.status(409).json({
                success: false,
                message: "Ce médicament existe déjà."
            });
        };

        const medicament = await Medicament.create({
            nom,
            description,
            dosage,
            categorie,
            alternatives,
        });

        res.status(201).json({
            success: true,
            message: "Medicament ajouté avec succès.",
            data: medicament,
        });
    } catch (error) {
        next(error);
    }
};

export const getMedicaments = async (req, res, next) => {
    try {
        const medicaments = await Medicament.find();

        if (medicaments.length === 0) {
            const error = new Error("Aucun médicament n'a été trouvé.");
            error.statusCode = 404;
            throw error;
        };

        res.status(200).json({
            success: true,
            message: "Médicament(s) trouvé(s).",
            total: medicaments.length,
            data: medicaments,
        });

    } catch (error) {
        next(error);
    }
};

export const getMedicament = async (req, res, next) => {
    try {
        const medicament = await Medicament.findById(req.params.id).populate('alternatives', 'nom dosage categorie');

        if (!medicament) {
            const error = new Error("Aucun médicament n'a été trouvé.");
            error.statusCode = 404;
            throw error;
            return res.status(404).json({
                succes: false,
                message: "Aucun médicament n'a été trouvé.",
            });
        };

        res.status(200).json({
            success: true,
            message: "Médicament trouvé.",
            data: medicament,
        });
    } catch (error) {
        next(error);
    }
};

export const updateMedicament = async (req, res, next) => {
    try {
        const champAutorises = ['nom', 'description', 'dosage'];
        const updateData = {};

        champAutorises.forEach((champ) => {
            if (req.body[champ] !== undefined) {
                updateData[champ] = req.body[champ];
            };
        });

        if (Object.keys(updateData).length === 0) {
            const error = new Error("Aucun champ valide à mettre à jour.");
            error.statusCode = 400;
            throw error;
        };

        const allowedRoles = ['pharmacien', 'admin'];

        if (!allowedRoles) {
            const error = new Error("Vous n'avez pas le droit de modifier ce medicament.");
            error.statusCode = 403;
            throw error;
        };

        const medicament = await Medicament.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { returnDocument: "after", runValidators: true }
        );

        if (!medicament) {
            const error = new Error("Médicament introuvable.");
            error.statusCode = 404;
            throw error;
        };

        res.status(200).json({
            success: true,
            message: "Médicament modifié avec succès.",
            data: medicament
        });

    } catch (error) {
        next(error);
    }
};

export const updateAlternatives = async (req, res, next) => {
    try {
        const { alternatives } = req.body; // tableau d'IDs

        if (!Array.isArray(alternatives)) {
            const error = new Error("Les alternatives doivent être un tableau d'IDs.");
            error.statusCode = 400;
            throw error;
        };

        // Vérifie que tous les IDs existent
        const medicamentsExistants = await Medicament.find({
            _id: { $in: alternatives }
        });

        if (medicamentsExistants.length !== alternatives.length) {
            const error = new Error("Un ou plusieurs médicaments alternatifs sont introuvables.");
            error.statusCode = 404;
            throw error;
        };

        // Empêcher un médicament d'être sa propre alternative
        if (alternatives.includes(req.params.id)) {
            const error = new Error("Un médicament ne peut pas être sa propre alternative.");
            error.statusCode = 400;
            throw error;
        };

        const medicament = await Medicament.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { alternatives } },
            { returnDocument: 'after', runValidators: true }
        ).populate('alternatives', 'nom categorie');

        if (!medicament) {
            const error = new Error("Médicament introuvable.");
            error.statusCode = 404;
            throw error;
        };

        res.status(200).json({
            success: true,
            message: "Alternatives mises à jour avec succès.",
            data: medicament,
        });

    } catch (error) {
        next(error);
    }
};

export const deleteMedicament = async (req, res, next) => {
    try {
        const medicament = await Medicament.findById(req.params.id);

        if (!medicament) {
            const error = new Error("Médicament introuvable.");
            error.statusCode = 404;
            throw error;
        };

        if (!medicament.isActive) {
            const error = new Error("Médicament déjà désactivé.");
            error.statusCode = 400;
            throw error;
        };

        medicament.isActive = false;
        medicament.deletedAt = new Date();
        await medicament.save();

        res.status(200).json({
            success: true,
            message: "Médicament supprimé avec succès.",
        });

    } catch (error) {
        next(error);
    }
};

export const restoreMedicament = async (req, res, next) => {
    try {
        const medicament = await collection.findOne({ _id: new ObjectId(req.params.id) });

        if (!medicament) {
            const error = new Error("Médicament introuvable.");
            error.statusCode = 404;
            throw error;
        };

        if (medicament.isActive) {
            const error = new Error("Médicament déjà active.");
            error.statusCode = 400;
            throw error;
        };

        await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { isActive: true, restoredAt: new Date() }, },
        );

        res.status(200).json({
            success: true,
            message: "Médicament restauré avec succès.",
        });
    } catch (error) {
        next(error);
    }
};

export const searchMedicament = async (req, res, next) => {
    try {
        const { s } = req.query;

        if (!s) {
            const error = new Error("Veuillez fournir un terme de recherche.");
            error.statusCode = 400;
            throw error;
        };

        const medicaments = await Medicament.find({
            $or: [
                { nom: { $regex: s, $options: 'i' } },
                { description: { $regex: s, $options: 'i' } },
                { categorie: { $regex: s, $options: 'i' } },
            ],
        }).populate('alternatives', 'nom dosage categorie description');

        res.status(200).json({
            success: true,
            total: medicaments.length,
            data: medicaments,
        });

    } catch (error) {
        next(error);
    }
};