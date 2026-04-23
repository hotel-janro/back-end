const express = require("express");
const { createPoolBooking, listPoolBookings } = require("../controllers/poolBookingController");

const router = express.Router();

router.get("/", listPoolBookings);
router.post("/", createPoolBooking);

module.exports = router;