import Stock from "../models/stock.model.js";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import Pharmacie from "../models/pharmacie.model.js";
import Medicament from "../models/medicament.model.js";


dotenv.config();

const client = new MongoClient(process.env.DB_URL);
const db = client.db();
const collection = db.collection('stocks');

export const createStock = async (req, res, next) => {
    try {
        const { pharmacie, medicament, quantite, prix } = req.body;

        // Verifier si la pharmacie existe.
        const existPharmacie = await Pharmacie.findById(pharmacie);
        if (!existPharmacie) {
            const error = new Error("Pharmacie introuvable.");
            error.statusCode = 404;
            throw error;
        };

        // Verifier si c'est le proprietaire ou l'admin.
        if (existPharmacie.proprietaire.toString() !== req.user.id && req.user.id !== 'admin') {
            const error = new Error("Vous n'êtes pas autorisé à gérer le stock de cette pharmacie.");
            error.statusCode = 404;
            throw error;
        };

        // Verifier si le medicament existe.
        const existMedicament = await Medicament.findById(medicament);
        if (!existMedicament) {
            const error = new Error("Médicament introuvable.");
            error.statusCode = 404;
            throw error;
        };

        // Verifier si le stock existe deja.
        const existeStock = await Stock.findOne({ pharmacie, medicament });
        if (existeStock) {
            const error = new Error("Ce stock existe déjà.");
            error.statusCode = 400;
            throw error
        };

        const stock = await Stock.create({
            pharmacie,
            medicament,
            quantite,
            prix,
        });

        res.status(201).json({
            succes: true,
            message: "Médicament ajouté au stock avec succès.",
            data: stock,
        });

    } catch (error) {
        next(error);
    }
};

export const getStocks = async (req, res, next) => {
    try {
            const stocks = await Stock.find().populate('pharmacie', 'nom').populate({
                path: 'medicament', 
                select: 'nom categorie description dosage photo alternatives prescriptionRequired',
                populate: {
                    path: 'alternatives', 
                    select: 'nom photo',
                },
            });
    
            if (!stocks) {
                res.status(404).json({ success: false, message: "Aucun stock trouvé" });
            };
    
            res.status(200).json({
                success: true,
                message: "Stock(s) trouvée(s).",
                total: stocks.length,
                data: stocks,
            });
    
        } catch (error) {
            next(error);
        }
}

export const updateStock = async (req, res, next) => {
    try {
        const stock = await Stock.findById(req.params.id).populate('pharmacie', 'proprietaire');

        if (!stock) {
            const error = new Error("Stock introuvable.");
            error.statusCode = 404;
            throw error;
        };

        // Verifie si c'est le proprietaire ou l'admin.
        if (stock.pharmacie.proprietaire.toString() !== req.user.id && req.user.role !== 'admin') {
            const error = new Error("Vous n'êtes pas autorisé à modifier ce stock.");
            error.statusCode = 403;
            throw error;
        };

        const champsAutorises = ['quantite', 'prix'];
        const updateData = {};

        champsAutorises.forEach((champ) => {
            if (req.body[champ] !== undefined) {
                updateData[champ] = req.body[champ];
            }
        });

        if (Object.keys(updateData).length === 0) {
            const error = new Error("Aucun champ valide à mettre à jour.");
            error.statusCode = 400;
            throw error;
        };

        const updated = await Stock.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { returnDocument: 'after', runValidators: true }
        ).populate('pharmacie', 'nom adresse').populate('medicament', 'nom dosage categorie');

        res.status(200).json({
            success: true,
            message: "Stock mis à jour avec succès.",
            data: updated,
        });

    } catch (error) {
        next(error);
    }
};

export const getStockPharmacie = async (req, res, next) => {
    try {
        if(!req.user) {
            const error = new Error('Non Authentifié.');
            error.statusCode = 401;
            throw error;
        };

        const { disponible } = req.query;

        const filtre = {pharmacie: req.params.id};

        // Filtrer uniquement les médicaments disponibles
        if (disponible === 'true') {
            filtre.estDisponible = true;
        }

        const stocks = await Stock.find(filtre).populate('medicament', 'nom categorie prescriptionRequired description').populate('pharmacie', 'nom');

        res.status(200).json({
            success: true,
            total: stocks.length,
            data: stocks,
        });

    } catch (error) {
        next(error);
    }
};

export const getStocksPharmacie = async (req, res, next) => {
    try {
        const id = req.params.id;
        const medicaments = await Stock.find({pharmacie: id}).populate('medicament', 'nom categorie dosage photo');

        if(medicaments.length === 0) {
            const error = new Error('Medicament introuvable.');
            error.statusCode = 404;
            throw error;
        };

        res.status(200).json({
            success: true,
            messages: 'Medicaments retournés.',
            data: medicaments,
        });
    } catch (error) {
        next(error);
    }
};

export const getPharmaciesMedicament = async (req, res, next) => {
    try {
        if(!req.user) {
            const error = new Error('Non Authentifié.');
            error.statusCode = 401;
            throw error;
        };

        const { disponible } = req.query;

        const filtre = { medicament: req.params.id };

        if (disponible === 'true') {
            filtre.estDisponible = true;
        }

        const stocks = await Stock.find(filtre).populate('pharmacie', 'nom adresse ville quartier contact horaire deGarde localisation');

        res.status(200).json({
            success: true,
            total: stocks.length,
            data: stocks,
        });

    } catch (error) {
        next(error);
    }
};

export const deleteStock = async (req, res, next) => {
    try {
        if(!req.user) {
            const error = new Error('Non Authentifié.');
            error.statusCode = 401;
            throw error;
        };

        const stock = await Stock.findById(req.params.id).populate('medicament', 'nom').populate('pharmacie', 'proprietaire nom');

        if(!stock) {
            const error = new Error("Stock introuvable.");
            error.statusCode = 404;
            throw error;
        };

        if(!stock.isActive) {
            const error = new Error("Stock déjà désactivé.");
            error.statusCode = 400;
            throw error;
        };

        if (stock.pharmacie.proprietaire.toString() !== req.user.id && req.user.role !== 'admin') {
            const error = new Error("Vous n'êtes pas autorisé à supprimer ce stock.");
            error.statusCode = 403;
            throw error;
        };

        stock.isActive = false;
        stock.deletedAt = new Date();
        await stock.save();

        res.status(200).json({
            success: true,
            message: `Le stock de ${stock.medicament.nom} a été supprimer à ${stock.pharmacie.nom}.`,
            data: stock,
        });

    } catch (error) {
        next(error);
    }
};

export const restoreStock = async (req, res, next) => {
    try {
        if(!req.user) {
            const error = new Error('Non Authentifié.');
            error.statusCode = 401;
            throw error;
        };
        
        const stock = await collection.findOne({ _id: new ObjectId(req.params.id) });

        if (!stock) {
            const error = new Error("Stock introuvable.");
            error.statusCode = 404;
            throw error;
        };

        if (stock.isActive === true) {
            const error = new Error("Stock déjà actif.");
            error.statusCode = 400;
            throw error;
        };

        await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { isActive: true, deletedAt: null, restoredAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            message: "Stock restauré avec succès.",
            data: stock,
        });

    } catch (error) {
        next(error);
    }
};