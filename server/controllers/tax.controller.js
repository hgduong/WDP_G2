const Tax = require("../models/tax");

const FOOD_BEVERAGE_COMBOS = [
  { id: "combo-snoopy", name: "Combo Snoopy" },
  { id: "combo-mario-bottle", name: "Combo Mario Bottle" },
  { id: "combo-blanket", name: "Combo Blanket" },
  { id: "combo-set-mario", name: "Combo Set Mario" },
  { id: "combo-premium-cgv", name: "Combo Premium CGV" },
  { id: "combo-premium-my", name: "Combo Premium MY" },
  { id: "combo-cgv", name: "Combo CGV" },
  { id: "combo-my", name: "Combo MY" },
];

const getAllTaxs = async (req, res) => {
  try {
    const taxes = await Tax.find().sort({ createdAt: -1 });
    res.json(taxes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCombos = async (req, res) => {
  try {
    res.json(FOOD_BEVERAGE_COMBOS);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTaxById = async (req, res) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (!tax) {
      return res.status(404).json({ message: "Không tìm thấy thuế" });
    }
    res.json(tax);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkActiveTaxOverlap = async (categoryName, applyFrom, applyTo, excludeId = null) => {
  const query = {
    categoryName,
    isActive: true,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  if (categoryName === "Movie Ticket") {
    if (applyFrom || applyTo) {
      query.$or = [
        {
          applyFrom: { $lte: new Date(applyTo || "9999-12-31") },
          $or: [
            { applyTo: { $gte: new Date(applyFrom) } },
            { applyTo: { $eq: null } },
          ],
        },
      ];
    }
  } else {
    if (applyTo && Array.isArray(applyTo) && applyTo.length > 0) {
      query.applyTo = { $in: applyTo };
    }
  }

  return Tax.findOne(query);
};

const createTax = async (req, res) => {
  try {
    const { categoryName, taxRate, description, applyFrom, applyTo, lastUpdatedBy } = req.body;

    const overlappingTax = await checkActiveTaxOverlap(categoryName, applyFrom, applyTo);

    if (overlappingTax) {
      return res.status(400).json({
        message: "Đã có mức thuế đang hoạt động cho danh mục này",
        overlap: true,
        existingTax: overlappingTax,
      });
    }

    const newTax = new Tax({
      categoryName,
      taxRate,
      description,
      applyFrom,
      applyTo,
      isActive: true,
      lastUpdatedBy: lastUpdatedBy || "Admin",
    });

    const savedTax = await newTax.save();
    res.status(201).json(savedTax);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTax = async (req, res) => {
  try {
    const { categoryName, taxRate, description, applyFrom, applyTo, isActive, lastUpdatedBy } = req.body;

    const existingTax = await Tax.findById(req.params.id);
    if (!existingTax) {
      return res.status(404).json({ message: "Không tìm thấy thuế" });
    }

    if (categoryName && categoryName !== existingTax.categoryName) {
      const overlappingTax = await checkActiveTaxOverlap(categoryName, applyFrom, applyTo, req.params.id);

      if (overlappingTax) {
        return res.status(400).json({
          message: "Đã có mức thuế đang hoạt động cho danh mục này",
          overlap: true,
          existingTax: overlappingTax,
        });
      }
    }

    existingTax.categoryName = categoryName || existingTax.categoryName;
    existingTax.taxRate = taxRate !== undefined ? taxRate : existingTax.taxRate;
    existingTax.description = description !== undefined ? description : existingTax.description;
    existingTax.applyFrom = applyFrom || existingTax.applyFrom;
    existingTax.applyTo = applyTo !== undefined ? applyTo : existingTax.applyTo;
    existingTax.isActive = isActive !== undefined ? isActive : existingTax.isActive;
    existingTax.lastUpdatedBy = lastUpdatedBy || existingTax.lastUpdatedBy;

    const updatedTax = await existingTax.save();
    res.json(updatedTax);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTax = async (req, res) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (!tax) {
      return res.status(404).json({ message: "Không tìm thấy thuế" });
    }

    tax.isActive = false;
    await tax.save();

    res.json({ message: "Đã vô hiệu hóa thuế thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkOverlap = async (req, res) => {
  try {
    const { categoryName, applyFrom, applyTo, excludeId } = req.body;

    const overlappingTax = await checkActiveTaxOverlap(categoryName, applyFrom, applyTo, excludeId);

    if (overlappingTax) {
      return res.json({
        hasOverlap: true,
        existingTax: overlappingTax,
      });
    }

    res.json({ hasOverlap: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTaxs,
  getCombos,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
  checkOverlap,
};