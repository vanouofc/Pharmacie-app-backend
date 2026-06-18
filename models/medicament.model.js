import mongoose from "mongoose";


const medicamentSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, "Le nom du medicament est obligatoire."],
        // unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    dosage: {
        type: Number,
    },
    categorie: {
        type: String,
        trim: true,
        enum: {
            values: [
                'Antibiotique',
                'Antalgique',
                'Anti-inflammatoire',
                'Antiparasitaire',
                'Antiviral',
                'Vaccin',
                'Vitamine',
                'Autre'
            ],
            message: "Catégorie invalide."
        }
    },
    prescriptionRequired: {
        type: Boolean,
        default: false
    },
    alternatives: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicament',
    }],
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

medicamentSchema.pre('find', function () {
    this.where({ isActive: true });
});

medicamentSchema.pre('findOne', function () {
    this.where({ isActive: true });
});



const Medicament = mongoose.model('Medicament', medicamentSchema);

export default Medicament;