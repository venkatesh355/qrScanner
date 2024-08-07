const express = require('express')
const router = express.Router()
const qrScanner = require('../controller/qr_scan.controller')

router.post('/getscandetail',qrScanner.getQrDetails)

module.exports = router