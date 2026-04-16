import { sequelize } from "../db/sequelize.js";
import { Order } from "../models/order.model.js";
import { Outbox } from "../models/outbox.model.js";
import { randomUUID } from "crypto";

export const addOrders = async (req, res) => {
  const { orders } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const result = [];

    for (let order of orders) {
      const id = randomUUID();

      const newOrder = await Order.create(
        {
          id,
          customerName: order.customerName,
          productName: order.productName,
          quantity: order.quantity,
        },
        { transaction }
      );

      await Outbox.create(
        {
          id: randomUUID(),
          payload: order,
          status: "PENDING",
        },
        { transaction }
      );

      result.push(newOrder);
    }

    await transaction.commit();

    res.status(201).json(result);
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};


export const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getOutbox = async (req, res) => {
  try {
    const outbox = await Outbox.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      count: outbox.length,
      data: outbox,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};