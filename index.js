require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const app = express()

app.use(express.json())
app.use(morgan("dev"))

const userRouter = require('./routers/user.route')
app.use(userRouter)

app.use((req, res) => {
    res.status(404).json({msg: "Not Found"})
})

const port = process.env.PORT || 3000

app.listen(port, () => { 
    const connectDatabase = require('./config/db.config')
    connectDatabase()
    console.log('Server is listening at port ' + port);
})