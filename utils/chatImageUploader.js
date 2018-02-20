const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./data/chat_image/")
    },
    filename: (req, file, cb) => {
      let ran = Math.floor(Math.random()*90000) + 10000;
      cb(null, ran + Date.now() + path.extname(file.originalname));
    }
  })
});

router.post("/", upload.single("image"), function (req, res) {
  if(req.file){
    res.send(req.file.path);
  }
  else{
    console.log("err");
  }
});

module.exports = router;