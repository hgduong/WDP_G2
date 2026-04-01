const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { authenticateToken, authorizeRoles } = require("../config/auth.middleware");

router.post("/payos/webhook", paymentController.handlePayOSWebhook);

router.get(
  "/:paymentId/status",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  paymentController.getPaymentStatus,
);

module.exports = router;
