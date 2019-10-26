import { Router } from 'express';
import multer from 'multer';
import UserController from './app/controllers/UserController';
import StudentController from './app/controllers/StudentController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import PlanController from './app/controllers/PlanController';
import EnrollmentController from './app/controllers/EnrollmentController';
import authMiddleware from './app/middlewares/auth';
import multerConfig from './config/multer';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.post('/students', StudentController.store);
routes.put('/students/:id', StudentController.update);

routes.post('/plans', PlanController.store);
routes.get('/plans', PlanController.index);
routes.put('/plans/:id', PlanController.update);
routes.delete('/plans/:id', PlanController.delete);

routes.get('/enrollments', EnrollmentController.index);
routes.post('/enrollments', EnrollmentController.store);
routes.put('/enrollments/:id', EnrollmentController.update);
routes.delete('/enrollments/:id', EnrollmentController.delete);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
