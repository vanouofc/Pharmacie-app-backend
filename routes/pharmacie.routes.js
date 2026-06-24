import { Router } from "express";
import { createPharmacie, deletePharmacie, gardPharmacie, getPharmacie, getPharmacies, getPharmaciesDeGarde, getPharmaciesParVille, getPharmaciesProches, restorePharmacie, updatePharmacie, verifiedPharmacie } from "../controllers/pharmacie.controller.js";
import { verifiedEmail } from "../middlewares/verifiedEmail.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { requireSession } from "../middlewares/requireSession.middleware.js";

const pharmacieRouter = Router();

//Routes utilisateurs connectés
pharmacieRouter.get('/', requireSession, getPharmacies);
pharmacieRouter.get('/gard', requireSession, getPharmaciesDeGarde);
pharmacieRouter.get('/city/dist', requireSession, getPharmaciesProches);
pharmacieRouter.get('/city/:ville', requireSession, getPharmaciesParVille);
pharmacieRouter.get('/:id', verifiedEmail, requireRole('pharmacien', 'admin'), getPharmacie);


// Routes Admin
pharmacieRouter.delete('/delete/:id', verifiedEmail, requireRole('admin'), deletePharmacie);
pharmacieRouter.post('/restore/:id', verifiedEmail, requireRole('admin'), restorePharmacie);
pharmacieRouter.patch('/status/:id', verifiedEmail, requireRole('admin'), verifiedPharmacie);

//Routes Admin/Pharmacien
pharmacieRouter.post('/', verifiedEmail, requireRole('pharmacien', 'admin'), createPharmacie);
pharmacieRouter.patch('/update/:id', verifiedEmail, requireRole('pharmacien', 'admin'), updatePharmacie);
pharmacieRouter.patch('/gard/:id', verifiedEmail, requireRole('pharmacien', 'admin'), gardPharmacie);


export default pharmacieRouter;