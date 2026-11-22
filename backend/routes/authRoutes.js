const router = require("express").Router();
const auth = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

router.post("/register", auth.register);
router.post("/login", auth.customerLogin);
router.post("/admin/login", auth.adminLogin);
router.get("/me", authenticate, auth.me);

module.exports = router;
