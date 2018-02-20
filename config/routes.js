// modules
const express = require("express");
const expressValidator = require("express-validator");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");

// routers
const index = require("../routes/index");
const api = require("../routes/api");
const chatImageUploader = require("../utils/chatImageUploader");

module.exports = function (app) {
  // static paths
  app.use("/scripts", express.static(path.join(__dirname, "../node_modules")));
  app.use(express.static("public"));

  // view engine setup
  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "pug");

  // uncomment after placing your favicon in /public
  // app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
  app.use(logger("dev"));
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
  app.use(expressValidator()); // Add this after the bodyParser middlewares!
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, "../public")));
  app.use(session({ secret: "ertbiggibpipiccttrture", resave: false, saveUninitialized: false}));
  app.use(flash());

  // routers
  app.use("/", index);
  app.use("/api/", api);
  app.use("/chatImageUploader", chatImageUploader);

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
  });

  // error handler
  app.use((err, req, res, next) => { // eslint-disable-line
  // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
  });
};
