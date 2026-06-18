import { Router } from "express";
import { deleteUser, getUser, getUsers, restoreUser, updateRole, updateUser } from "../controllers/user.controller.js";
import { verifiedEmail } from "../middlewares/verifiedEmail.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { requireSession } from "../middlewares/requireSession.middleware.js";


const userRouter = Router();



// Routes admin.
userRouter.get('/', verifiedEmail, requireRole('admin'), getUsers);
userRouter.patch('/role/:id', verifiedEmail, requireRole('admin'), updateRole);
userRouter.delete('/:id', verifiedEmail, requireRole('admin'), deleteUser);
userRouter.post('/restore/:id', verifiedEmail, requireRole('admin'), restoreUser);


// Route de l'utilisateur connecté:
userRouter.patch('/update/:id', requireSession, updateUser);
userRouter.get('/:id',requireSession, getUser);





export default userRouter; 