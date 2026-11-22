const router = require("express").Router();
const plays = require("../controllers/openPlayController");
const { authenticate, optionalAuth, requireRole } = require("../middleware/authMiddleware");

router.get("/", optionalAuth, plays.list);
router.get("/mine", authenticate, requireRole("customer"), plays.mine);
router.post("/:id/join", authenticate, requireRole("customer"), plays.join);
router.delete("/:id/join", authenticate, requireRole("customer"), plays.leave);

module.exports = router;
