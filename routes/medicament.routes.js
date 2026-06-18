import { Router } from "express";
import { createMedicament, deleteMedicament, getMedicament, getMedicaments, restoreMedicament, searchMedicament, updateAlternatives, updateMedicament } from "../controllers/medicament.controller.js";
import { requireSession } from "../middlewares/requireSession.middleware.js";
import { verifiedEmail } from "../middlewares/verifiedEmail.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";

const medicamentRouter = Router();

// Routes utilisateurs conectés.
medicamentRouter.get('/', requireSession, getMedicaments);
medicamentRouter.post('/s', requireSession, searchMedicament);
medicamentRouter.get('/:id', requireSession, getMedicament);

// Routes Admin/Pharmacien
medicamentRouter.post('/', verifiedEmail, requireRole('pharmacien', 'admin'), createMedicament);
medicamentRouter.patch('/alt/:id', verifiedEmail, requireRole('pharmacien', 'Admin'), updateAlternatives);
medicamentRouter.patch('/:id', verifiedEmail, requireRole('pharmacien', 'admin'), updateMedicament);
medicamentRouter.delete('/delete/:id', verifiedEmail, requireRole('pharmacien', 'admin'), deleteMedicament);

// Routes admin
medicamentRouter.post('/restore/:id', verifiedEmail, requireRole('admin'), restoreMedicament);


export default medicamentRouter;