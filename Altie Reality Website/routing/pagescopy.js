const express = require("express");
const router = express.Router();
const auth = require("../autorisation/auth");

router.get("/", (req, res) => {
  res.render("home");
});
router.get("/privacy", (req, res) => {
  res.render("privacy.hbs");
});
router.get("/termsandconditions", (req, res) => {
  res.render("termsandconditions.hbs");
});
router.get("/reliconnectprivacy", (req, res) => {
  res.render("reliconnectprivacy.hbs");
});
router.get("/reliconnecttermsandconditions", (req, res) => {
  res.render("reliconnecttermsandconditions.hbs");
});
router.get("/creditsandlicenses", (req, res) => {
  res.render("creditsandlicenses.hbs");
});
router.get("/login", auth, (req, res) => {
  if (req.user) {
    return res.redirect("/demo");
  }
  res.render("login", {
    sahiyagalat: false,
  });
});
router.get("/contactus", auth, (req, res) => {
  if (req.user) {
    res.render("contactus", {
      isnotloggedin: false,
      user: req.user,
    });
  } else {
    res.render("contactus", {
      isnotloggedin: true,
    });
  }
});

router.get("/demo", auth, (req, res) => {
  //before giving access to secret page we need to authenticate the user through the jwt which is stored as cookie so we first get it using auth middleware

  res.render("secret");
});

router.get("/blank.hbs", auth, (req, res) => {
  //before giving access to secret page we need to authenticate the user through the jwt which is stored as cookie so we first get it using auth middleware

  res.render("blank");
});
router.get("/profile.hbs", auth, (req, res) => {
  //before giving access to secret page we need to authenticate the user through the jwt which is stored as cookie so we first get it using auth middleware

  res.render("profile");
});
router.get("/table.hbs", auth, (req, res) => {
  //before giving access to secret page we need to authenticate the user through the jwt which is stored as cookie so we first get it using auth middleware

  res.render("table");
});
router.get("/blank-1.hbs", auth, (req, res) => {
  //before giving access to secret page we need to authenticate the user through the jwt which is stored as cookie so we first get it using auth middleware

  res.render("blank-1");
});
router.get("/blank.hbs", auth, (req, res) => {
  //before giving access to secret page we need to authenticate the user through the jwt which is stored as cookie so we first get it using auth middleware

  res.render("blank");
});
router.get("/typeform.hbs", auth, (req, res) => {
  //before giving access to secret page we need to authenticate the user through the jwt which is stored as cookie so we first get it using auth middleware

  res.render("typeform");
});
router.get("/secret.hbs", auth, (req, res) => {
  //before giving access to secret page we need to authenticate the user through the jwt which is stored as cookie so we first get it using auth middleware

  res.render("secret");
});
router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.clearCookie("google-token"); //to logout we will remove the cookie so no authentication can be done now hence can't access private pages;

  res.redirect("/");
});
module.exports = router;
