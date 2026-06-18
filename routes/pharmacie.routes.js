import { Router } from "express";
import { createPharmacie, deletePharmacie, getPharmacie, getPharmacies, getPharmaciesDeGarde, getPharmaciesParVille, getPharmaciesProches, restorePharmacie, updatePharmacie, verifiedPharmacie } from "../controllers/pharmacie.controller.js";
import { verifiedEmail } from "../middlewares/verifiedEmail.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { requireSession } from "../middlewares/requireSession.middleware.js";

const pharmacieRouter = Router();

//Routes utilisateurs connectés
pharmacieRouter.get('/gard', requireSession, getPharmaciesDeGarde);
pharmacieRouter.get('/city/dist', requireSession, getPharmaciesProches);
pharmacieRouter.get('/city/:ville', requireSession, getPharmaciesParVille);


// Routes Admin
pharmacieRouter.get('/', verifiedEmail, requireRole('admin', 'Admin'), getPharmacies);
pharmacieRouter.delete('/delete/:id', verifiedEmail, requireRole('admin', 'Admin'), deletePharmacie);
pharmacieRouter.post('/restore/:id', verifiedEmail, requireRole('admin', 'Admin'), restorePharmacie);
pharmacieRouter.patch('/status/:id', verifiedEmail, requireRole('admin', 'Admin'), verifiedPharmacie);

//Routes Admin/Pharmacien
pharmacieRouter.post('/', verifiedEmail, requireRole('pharmacien', 'admin', 'Admin'), createPharmacie);
pharmacieRouter.get('/:id', verifiedEmail, requireRole('pharmacien', 'admin', 'Admin'), getPharmacie);
pharmacieRouter.patch('/update/:id', verifiedEmail, requireRole('pharmacien', 'admin', 'Admin'), updatePharmacie);


export default pharmacieRouter;