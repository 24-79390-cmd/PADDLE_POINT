const router = require("express").Router();
const admin = require("../controllers/adminController");
const { authenticate, requireRole } = require("../middleware/authMiddleware");

// Every route below needs a valid token AND the admin role (checked in the database)
router.use(authenticate, requireRole("admin"));

router.get("/stats", admin.stats);

router.get("/bookings", admin.listBookings);
router.patch("/bookings/:id/status", admin.setBookingStatus);

router.put("/courts/:id", admin.updateCourt);

router.get("/blocked", admin.listBlocked);
router.post("/blocked", admin.createBlocked);
router.delete("/blocked/:id", admin.deleteBlocked);

router.get("/customers", admin.listCustomers);
router.patch("/customers/:id/active", admin.setCustomerActive);

router.get("/reports", admin.reports);

router.get("/open-plays", admin.listOpenPlays);
router.post("/open-plays", admin.createOpenPlay);
router.put("/open-plays/:id", admin.updateOpenPlay);
router.patch("/open-plays/:id/cancel", admin.cancelOpenPlay);

module.exports = router;
