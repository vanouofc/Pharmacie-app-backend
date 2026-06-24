import { Router } from "express";
import { createStock, deleteStock, getPharmaciesMedicament, getStockPharmacie, getStocks, getStocksPharmacie, restoreStock, updateStock } from "../controllers/stock.controller.js";
import { requireSession } from "../middlewares/requireSession.middleware.js";
import { verifiedEmail } from "../middlewares/verifiedEmail.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";


const stockRouter = Router();


// Route utilisateurs connectés.
stockRouter.get('/', requireSession, getStocks);
stockRouter.get('/:id', requireSession, getStocksPharmacie);
stockRouter.get('/pharmacie/:id', requireSession, getStockPharmacie);
stockRouter.get('/medicament/:id', requireSession, getPharmaciesMedicament);

// Routes admin/pharmaciens.
stockRouter.post('/', verifiedEmail, requireRole('pharmacien', 'admin'), createStock);
stockRouter.patch('/:id', verifiedEmail, requireRole('pharmacien', 'admin'), updateStock);
stockRouter.delete('/delete/:id', verifiedEmail, requireRole('pharmacien', 'admin'), deleteStock);

// Routes admin.
stockRouter.post('/restore/:id', requireSession, restoreStock);


export default stockRouter;