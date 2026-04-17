import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import messagesRouter from "./messages";
import appointmentsRouter from "./appointments";
import vitalsRouter from "./vitals";
import medicationsRouter from "./medications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(messagesRouter);
router.use(appointmentsRouter);
router.use(vitalsRouter);
router.use(medicationsRouter);
router.use(dashboardRouter);

export default router;
