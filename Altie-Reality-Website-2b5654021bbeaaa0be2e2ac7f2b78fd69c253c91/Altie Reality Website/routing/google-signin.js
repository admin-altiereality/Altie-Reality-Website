require("dotenv").config();
const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const googlesignUpModel = require("../mongooseschema").googlesignUpModel;

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware

router.post("/glogin", (req, res) => {
	
  // if someone has already logged in using email then the token should be removed so that the authentication is done once
  res.clearCookie("jwt");
  res.clearCookie("google-token");

  let token = req.body.token;
	

  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    //adding number and password as in schema these are required
    googlesignUpModel
      .findOne({ email: payload.email })
      .then((user) => {
        if (!user) {
          const obj2 = new googlesignUpModel({
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            type: "google",
          });
          obj2
            .save()
            .then((obj2) => console.log("saved google data"))
            .catch((err) => console.log(err));
        } else {
          console.log("welcome back");
        }
      })
      .catch((err) => console.log(err));

    const userid = payload["sub"];
  }

  verify()
    .then(() => {
     
      res.cookie("google-token", token, { sameSite: "none", secure: true });
     
      res.send("success");
    })
    .catch(console.error);
});

router.get("/secretpage2", (req, res) => {
  let user = req.user;

  res.render("secretpage2", { user });
});

router.get("/protectedRoute", (req, res) => {
  res.send("This route is protected");
});

// function checkAuthenticated(req, res, next) {
//   let token = req.cookies["google-token"];

//   let user = {};
//   async function verify() {
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
//     });
//     const payload = ticket.getPayload();

//     user.name = payload.name;
//     user.email = payload.email;
//     user.picture = payload.picture;
//     user.fname = payload.given_name;
//     user.lname = payload.family_name;
//   }
//   verify()
//     .then(() => {
//       req.user = user;
//       next();
//     })
//     .catch((err) => {
//       res.redirect("/login");
//     });
// }

module.exports.router = router;
// module.exports.checkAuthenticated = checkAuthenticated;
