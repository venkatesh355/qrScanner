const express = require('express')
const app = express()
const router = require ('./routes/qr.scan.routes')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const PORT = 8000
app.use(express.json())
app.use(cors())

app.use(express.urlencoded({ extended: true }))
app.use(fileUpload())

app.use('/',router)


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})

