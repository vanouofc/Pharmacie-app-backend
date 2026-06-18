import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
    pharmacie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacie',
        required: [true, "Les informations de la pharmacie sont requises dans le stock."]
    },
    medicament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicament',
        required: [true, "Les informations du médicament sont requises dans le stock."]
    },
    quantite: {
        type: Number,
        required: [true, "La quantité en stock est requise."],
        min: [0, "La quantité ne peut pas être négative."]
    },
    prix: {
        type: Number,
        required: [true, "Le prix du médicament est requis."],
        min: [0, "Le prix ne peut pas être négatif."],
    },
    estDisponible: {
        type: Boolean,
        default: true,
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


stockSchema.pre('save', function () {
    this.estDisponible = this.quantite > 0;
});

// Pour les updateOne/findByIdAndUpdate
stockSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate();
    if (update.$set?.quantite !== undefined) {
        update.$set.estDisponible = update.$set.quantite > 0;
    }
});

stockSchema.pre('find', function () {
    this.where({ isActive: true });
});

stockSchema.pre('findOne', function () {
    this.where({ isActive: true });
});

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;