const express = require("express");
const router = express.Router();
const taxController = require("../controllers/tax.controller");

router.get("/", taxController.getAllTaxs);
router.get("/combos", taxController.getCombos);
router.get("/active/food-beverage", taxController.getActiveFoodBeverageTax);
router.get("/:id", taxController.getTaxById);
router.post("/", taxController.createTax);
router.put("/:id", taxController.updateTax);
router.delete("/:id", taxController.deleteTax);
router.post("/check-overlap", taxController.checkOverlap);

module.exports = router;