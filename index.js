require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

const userRouter = require("./routers/user.route");
app.use(userRouter);

// Error 404 - Not found
app.use((req, res, next) => {
    next(createError.NotFound());
});

// Handle error middleware
app.use((err, req, res, next) => {
    console.log(err);
    console.log(req.body);
    res.status(err.status || 500);
    res.json({ msg: err.message });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    const connectDatabase = require("./config/db.config");
    connectDatabase();
    console.log("Server is listening at port " + port);
});
