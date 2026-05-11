import {Router} from "express";
import {addOrders_Transactional_Outbox_Pattern,addOrders_Listen_To_Yourself,getOrders,getOutbox} from "../controllers/order.controller.js";

const router = Router();

router.route("/add-order-top").post(addOrders_Transactional_Outbox_Pattern);
router.route("/add-order-ltu").post(addOrders_Listen_To_Yourself);
router.route("/get-orders").get(getOrders);
router.route("/get-outbox").get(getOutbox);

export default router;