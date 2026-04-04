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

const DAY_MAP = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

const calculateTax = async (req, res) => {
  try {
    const { cinemaId, roomType, showtimeId, categoryName, showtimeDate } = req.body;
    
    const defaultTaxRates = {
      "Movie Ticket": 8,
      "Food & Beverage": 10,
    };

    const baseTaxRate = defaultTaxRates[categoryName] || 8;
    
    let finalTaxRate = baseTaxRate;
    let taxBreakdown = {
      baseRate: baseTaxRate,
      roomTypeRate: null,
      showtimeRuleRate: null,
      finalRate: baseTaxRate,
      appliedRules: [],
    };

    const taxes = await Tax.find({ 
      categoryName, 
      isActive: true,
      $or: [
        { cinemaId: null },
        { cinemaId: cinemaId }
      ]
    }).sort({ priority: -1, roomTypePriority: -1 });

    const roomTypeTax = taxes.find(t => 
      t.taxType === "room_type" && 
      t.roomType === roomType
    );

    if (roomTypeTax && roomTypeTax.taxRate > 0) {
      finalTaxRate = roomTypeTax.taxRate;
      taxBreakdown.roomTypeRate = roomTypeTax.taxRate;
      taxBreakdown.appliedRules.push({
        type: "room_type",
        roomType: roomTypeTax.roomType,
        rate: roomTypeTax.taxRate,
      });
      return res.json({ rate: finalTaxRate, breakdown: taxBreakdown });
    }

    if (showtimeDate) {
      const date = new Date(showtimeDate);
      const showtimeDay = DAY_MAP[date.getDay()];
      const showtimeHour = date.getHours();
      const showtimeMinutes = date.getMinutes();
      const showtimeTime = `${String(showtimeHour).padStart(2, "0")}:${String(showtimeMinutes).padStart(2, "0")}`;

      const showtimeRules = taxes.filter(t => t.taxType === "showtime_rule");
      
      for (const rule of showtimeRules) {
        if (!rule.daysOfWeek || !rule.daysOfWeek.includes(showtimeDay)) continue;
        
        if (rule.timeStart && rule.timeEnd) {
          if (showtimeTime < rule.timeStart || showtimeTime > rule.timeEnd) continue;
        }

        if (rule.adjustmentType === "add") {
          finalTaxRate = baseTaxRate + (rule.additionalRate || 0);
        } else if (rule.adjustmentType === "replace") {
          finalTaxRate = rule.additionalRate || baseTaxRate;
        }

        taxBreakdown.showtimeRuleRate = finalTaxRate;
        taxBreakdown.appliedRules.push({
          type: "showtime_rule",
          daysOfWeek: rule.daysOfWeek,
          timeRange: `${rule.timeStart}-${rule.timeEnd}`,
          rate: finalTaxRate,
        });
        break;
      }
    }

    taxBreakdown.finalRate = finalTaxRate;
    return res.json({ rate: finalTaxRate, breakdown: taxBreakdown });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

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

const getActiveFoodBeverageTax = async (req, res) => {
  try {
    const taxes = await Tax.find({ categoryName: "Food & Beverage", isActive: true });
    const now = new Date();
    
    const validTax = taxes.find((t) => {
      const applyFrom = new Date(t.applyFrom);
      return now >= applyFrom;
    });
    
    if (validTax) {
      return res.status(200).json(validTax);
    }
    return res.status(200).json(null);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getActiveMovieTicketTax = async (req, res) => {
  try {
    const taxes = await Tax.find({ categoryName: "Movie Ticket", isActive: true });
    const now = new Date();
    
    const validTax = taxes.find((t) => {
      const applyFrom = new Date(t.applyFrom);
      return now >= applyFrom;
    });
    
    if (validTax) {
      return res.status(200).json(validTax);
    }
    return res.status(200).json(null);
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
    const {
      taxType,
      categoryName,
      taxRate,
      description,
      applyFrom,
      applyTo,
      lastUpdatedBy,
      cinemaId,
      roomType,
      roomTypePriority,
      showtimeId,
      daysOfWeek,
      timeStart,
      timeEnd,
      adjustmentType,
      additionalRate,
      priority,
      isActive,
    } = req.body;

    const newTax = new Tax({
      taxType: taxType || "category",
      categoryName,
      taxRate: taxRate || 0,
      description,
      applyFrom: applyFrom || new Date().toISOString(),
      applyTo,
      isActive: isActive !== undefined ? isActive : true,
      lastUpdatedBy: lastUpdatedBy || "Admin",
      cinemaId: cinemaId || null,
      roomType,
      roomTypePriority,
      showtimeId,
      daysOfWeek,
      timeStart,
      timeEnd,
      adjustmentType,
      additionalRate,
      priority,
    });

    const savedTax = await newTax.save();
    res.status(201).json(savedTax);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTax = async (req, res) => {
  try {
    const {
      taxType,
      categoryName,
      taxRate,
      description,
      applyFrom,
      applyTo,
      isActive,
      lastUpdatedBy,
      cinemaId,
      roomType,
      roomTypePriority,
      showtimeId,
      daysOfWeek,
      timeStart,
      timeEnd,
      adjustmentType,
      additionalRate,
      priority,
    } = req.body;

    const existingTax = await Tax.findById(req.params.id);
    if (!existingTax) {
      return res.status(404).json({ message: "Không tìm thấy thuế" });
    }

    if (taxType !== undefined) existingTax.taxType = taxType;
    if (categoryName) existingTax.categoryName = categoryName;
    if (taxRate !== undefined) existingTax.taxRate = taxRate;
    if (description !== undefined) existingTax.description = description;
    if (applyFrom) existingTax.applyFrom = applyFrom;
    if (applyTo !== undefined) existingTax.applyTo = applyTo;
    if (isActive !== undefined) existingTax.isActive = isActive;
    if (lastUpdatedBy) existingTax.lastUpdatedBy = lastUpdatedBy;
    if (cinemaId !== undefined) existingTax.cinemaId = cinemaId;
    if (roomType !== undefined) existingTax.roomType = roomType;
    if (roomTypePriority !== undefined) existingTax.roomTypePriority = roomTypePriority;
    if (showtimeId !== undefined) existingTax.showtimeId = showtimeId;
    if (daysOfWeek !== undefined) existingTax.daysOfWeek = daysOfWeek;
    if (timeStart !== undefined) existingTax.timeStart = timeStart;
    if (timeEnd !== undefined) existingTax.timeEnd = timeEnd;
    if (adjustmentType !== undefined) existingTax.adjustmentType = adjustmentType;
    if (additionalRate !== undefined) existingTax.additionalRate = additionalRate;
    if (priority !== undefined) existingTax.priority = priority;

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
  getActiveFoodBeverageTax,
  getActiveMovieTicketTax,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
  checkOverlap,
  calculateTax,
};