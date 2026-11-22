const router = require("express").Router();
const courts = require("../controllers/courtController");

router.get("/", courts.list);
router.get("/:id/availability", courts.availability);

module.exports = router;
