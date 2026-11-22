const router = require("express").Router();
const bookings = require("../controllers/bookingController");
const { authenticate, requireRole } = require("../middleware/authMiddleware");

router.use(authenticate, requireRole("customer"));

router.post("/", bookings.create);
router.get("/mine", bookings.mine);
router.patch("/:id/cancel", bookings.cancel);

module.exports = router;
