import Pharmacie from "../models/pharmacie.model.js";
import { ObjectId, MongoClient, ReturnDocument } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.DB_URL);
const db = client.db();
const collection = db.collection('pharmacies');


export const createPharmacie = async (req, res, next) => {
    try {

        // ─── Helper : construire le GeoJSON ─────────────────────
        const buildLocalisation = (longitude, latitude) => ({
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
        });

        const { nom, adresse, ville, quartier, longitude, latitude, contact, horaires, proprietaire } = req.body;

        const existPharmacie = await Pharmacie.findOne({ nom: nom, ville: ville });

        if (existPharmacie) {
            return res.status(409).json({
                success: false,
                message: `La pharmacie ${nom} existe déjà à ${ville}`,
            });
        };

        if (!longitude || !latitude) {
            const error = new Error("La localisation est requise (longitude et latitude).");
            error.statusCode = 400;
            throw error;
        };

        const pharmacie = await Pharmacie.create({
            nom,
            adresse,
            ville,
            quartier,
            localisation: buildLocalisation(longitude, latitude),
            contact,
            horaires,
            proprietaire: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: "Pharmacie crée avec succès.",
            data: pharmacie,
        });

    } catch (error) {
        next(error);
    }
};

export const getPharmacies = async (req, res, next) => {
    try {
        const pharmacies = await Pharmacie.find();

        if (!pharmacies) {
            res.status(404).json({ success: false, message: "Aucune pharmacie trouvée" });
        };

        res.status(200).json({
            success: true,
            message: "Pharmacie(s) trouvée(s).",
            total: pharmacies.length,
            data: pharmacies,
        });

    } catch (error) {
        next(error);
    }
};

export const getPharmacie = async (req, res, next) => {
    try {
        const pharmacie = await Pharmacie.findById(req.params.id).populate('proprietaire', 'nom email phone');

        if (!pharmacie) {
            const error = new Error("Pharmacie introuvable.");
            error.statusCode = 404;
            throw error;
        };

        res.status(200).json({
            success: true,
            message: "Pharmacie trouvée",
            data: pharmacie,
        });

    } catch (error) {
        next(error);
    }
};

export const updatePharmacie = async (req, res, next) => {
    try {

        const pharmacie = await Pharmacie.findById(req.params.id);

        if (!pharmacie) {
            const error = new Error("Pharmacie introuvable.");
            error.statusCode = 404;
            throw error;
        };

        // Vérifie que c'est le propriétaire ou un Admin
        if (pharmacie.proprietaire.toString() !== req.user.id && req.user.role !== 'admin') {
            const error = new Error("Vous n'êtes pas autorisé à modifier cette pharmacie.");
            error.statusCode = 403;
            throw error;
        }

        const champsAutorises = ['nom', 'adresse', 'ville', 'quartier', 'contact', 'horaires', 'deGarde', 'isOpen'];
        const updateData = {};

        champsAutorises.forEach((champ) => {
            if (req.body[champ] !== undefined) {
                updateData[champ] = req.body[champ];
            }
        });

        // Mise à jour des coordonnées si fournies
        if (req.body.coordinates) {
            updateData.localisation = {
                type: 'Point',
                coordinates: req.body.coordinates,
            };
        };

        if (Object.keys(updateData).length === 0) {
            const error = new Error("Aucun champ valide à mettre à jour.");
            error.statusCode = 400;
            throw error;
        };

        const updated = await Pharmacie.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Pharmacie mise à jour avec succès.",
            data: updated,
        });

    } catch (error) {
        next(error);
    }
};

export const verifiedPharmacie = async (req, res, next) => {
    try {

        const requiredRole = ['admin', 'Admin'];

        const pharmacie = await Pharmacie.findById(req.params.id);

        if (!pharmacie) {
            const error = new Error('Pharmacie introuvable');
            error.statusCode = 404;
            throw error;
        };

        // Vérifie que c'est un Admin
        if (!requiredRole) {
            const error = new Error("Vous n'êtes pas autorisé à modifier cette pharmacie.");
            error.statusCode = 403;
            throw error;
        };

        const verified = await Pharmacie.updateOne(
            { _id: req.params.id, },
            { $set: { status: !pharmacie.status } },
            { new: true, runValidators: true },
        );

        res.status(200).json({
            success: true,
            message: "Le statut de la pharmacie a bien été modifier.",
            data: verified,
        });

    } catch (error) {
        next(error);
    }
};

export const deletePharmacie = async (req, res, next) => {
    try {

        const pharmacie = await Pharmacie.findById(req.params.id);

        if (!pharmacie) {
            const error = new Error("Pharmacie introuvable.");
            error.statusCode = 404;
            throw error;
        };

        if (!pharmacie.isActive) {
            const error = new Error("Pharmacie déjà supprimée.");
            error.statusCode = 400;
            throw error;
        };

        pharmacie.isActive = false;
        pharmacie.deletedAt = new Date();
        await pharmacie.save();

        res.status(200).json({
            success: true,
            message: "Pharmacie supprimée avec succès.",
        });

    } catch (error) {
        next(error);
    }
};

export const restorePharmacie = async (req, res, next) => {

    try {

        const pharmacie = await collection.findOne({ _id: new ObjectId(req.params.id) });

        if (!pharmacie) {
            const error = new Error("Pharmacie introuvable.");
            error.statusCode = 404;
            throw error;
        };

        if (pharmacie.isActive) {
            const error = new Error("Pharmacie déjà active.");
            error.statusCode = 400;
            throw error;
        };

        await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { isActive: true, restoredAt: new Date() }, },
        );

        res.status(200).json({
            success: true,
            message: "Pharmacie restaurée avec succès.",
        });

    } catch (error) {
        next(error);
    }
};

export const getPharmaciesDeGarde = async (req, res, next) => {

    try {

        const pharmacie = await Pharmacie.find({ deGarde: true });

        if (!pharmacie) {
            const error = new Error("Aucune pharmacie de garde disponible.");
            error.statusCode = 404;
            throw error;
        };

        res.status(200).json({
            success: true,
            message: "Pharmacie(s) de garde(s) trouvée(s).",
            total: pharmacie.length,
            data: pharmacie,
        });

    } catch (error) {
        next(error);
    }
};

export const getPharmaciesParVille = async (req, res, next) => {
    try {

        const { ville } = req.params;
        const { quartier } = req.query;

        const filtre = { ville: { $regex: ville, $options: 'i' } };

        // Filtrer par quartier si fourni
        if (quartier) {
            filtre.quartier = { $regex: quartier, $options: 'i' };
        }

        const pharmacies = await Pharmacie.find(filtre);

        res.status(200).json({
            success: true,
            total: pharmacies.length,
            message: `Pharmacie(s) dans la ville de ${ville} trouvée(s).`,
            data: pharmacies,
        });

    } catch (error) {
        next(error);
    }
};

export const getPharmaciesProches = async (req, res, next) => {
    try {

        const { longitude, latitude, distance = 10000 } = req.query; // distance en mètres, défaut 5km

        if (!longitude || !latitude) {
            const error = new Error("Veuillez fournir la longitude et la latitude.");
            error.statusCode = 400;
            throw error;
        }

        const pharmacies = await Pharmacie.find({
            localisation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                    $maxDistance: parseInt(distance),
                },
            },
        });

        res.status(200).json({
            success: true,
            total: pharmacies.length,
            rayon: `${distance / 1000} km`,
            data: pharmacies,
        });

    } catch (error) {
        next(error);
    }
};