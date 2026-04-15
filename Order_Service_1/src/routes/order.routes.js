import {Router} from "express";
import {addOrders,getOrders,getOutbox} from "../controllers/order.controller.js";

const router = Router();

router.route("/add-order").post(addOrders);
router.route("/get-orders").get(getOrders);
router.route("/get-outbox").get(getOutbox);

export default router;