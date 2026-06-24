import mongoose from "mongoose";

const pharmacieSchema = new mongoose.Schema({

    nom: {
        type: String,
        required: [true, 'Le nom de la pharmacie est requis.'],
        trim: true
    },
    status: {
        type: Boolean,
        default: false,
    },
    adresse: {
        type: String,
        required: [true, "L'adresse de la pharmacie est requise."],
        trim: true
    },
    ville: {
        type: String,
        required: [true, "Veuiller renseigner la ville de la pharmacie."],
        trim: true
    },
    photo: {
        type: String,
    },
    quartier: {
        type: String,
        required: [true, "Veuiller renseigner le quartier de la pharmacie."],
        trim: true
    },
    localisation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: {
            type: [Number],  // [longitude, latitude]
            required: true,
            // index: '2dsphere'  // Pour les requêtes géospatiales
        }
    },
    contact: {
        type: String,
        trim: true
    },
    horaires: {
        type: String,
        required: [true, "Les horaires de la pharmacie sont obligatoires"],
        trim: true
    },
    deGarde: {
        type: Boolean,
        default: false
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    proprietaire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: [true, "Indiquer le proprietaire de la pharmacie."]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },

}, { timestamps: true });

pharmacieSchema.index({ ville: 1, quartier: 1 });

pharmacieSchema.index({ localisation: '2dsphere' });

pharmacieSchema.pre('find', function () {
    this.where({ isActive: true });
});
pharmacieSchema.pre('findOne', function () {
    this.where({ isActive: true });
});

const Pharmacie = mongoose.model('Pharmacie', pharmacieSchema);

export default Pharmacie;