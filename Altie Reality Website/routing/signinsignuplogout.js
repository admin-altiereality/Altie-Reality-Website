const express = require("express");
const router = express.Router();

const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const signUpModel = require("../mongooseschema").signUpModel;

const crypto = require("crypto");
const { SendEmail, SendEmail2,SendEmail3 } = require("../nodemailer");

router.post(
  "/signup",
  [
    check("email", "Invalid Email...Enter a vaild email")
      .isEmail()
      .normalizeEmail(),
  ],
  async (req, res) => {
    try {
      // if anyone is already logged in via google or email we are clearing data from cookies just to be safe
      res.clearCookie("google-token");

      let expresserr = validationResult(req);
      if (!expresserr.isEmpty()) {
        return res.render("login", {
          sahiyagalat: true,
          errortype: "warning",
          msgtype: "Oops!",
          errormsg:
            "The email you entered seems invalid..check your email and try again ..",
        });
      }
      crypto.randomBytes(32, async function (err, buffer) {
        if (err) {
          console.log(err);
        } else {
          let token = buffer.toString("hex");

          const obj = new signUpModel({
            ...req.body,
            resettoken: token,
            type: "email",
          });

          let useralreadyexist = await signUpModel.findOne({
            $or: [{ email: req.body.email }, { number: req.body.number }],
          });

          if (useralreadyexist) {
            console.log(useralreadyexist);
            return res.render("login", {
              sahiyagalat: true,
              errortype: "warning",
              msgtype: "Oops!",
              errormsg:
                "This mail or number is already registered with us..Login Instead",
            });
          }

          //we are using two middleware the token generator and the hashing thing
          let tokenhere = await obj.generateToken();
          //   //adding token as a cookie in the browser
          //   res.cookie("jwt", tokenhere, {
          //     expires: new Date(Date.now() + 2000000),
          //     httpOnly: true,
          //   });
          obj.save(function (err, obj) {
            if (err) {
              if (err.errors) {
                //when some field are empty then we get an object errors
                return res.render("login", {
                  sahiyagalat: true,
                  errortype: "danger",
                  msgtype: "OOps!",
                  errormsg: "Invalid details ....fill all the detalis",
                });
              }
              res.json({ error: err });
            } else {
              SendEmail(obj);
		    SendEmail3(obj);
              res.render("login", {
                sahiyagalat: true,
                errortype: "success",
                msgtype: "Hurray!",
                errormsg:
                  "We've sent an verification email..please verify it and login to continute.",
              });
            }
          });
        }
      });
    } catch (error) {
      res
        .status(400)
        .send(
          error +
            "   unknow error occured try again  ...if problem continues contact us"
        );
    }
  }
);

//will by default search home file in view folder ....so the folder name must be view only ...and if you make this folder in other directory then you have to use path.join method to tell where this folder is....and if the view folder is outde only it will automatically take files from it
router.post("/signin", (req, res) => {
  // if someone was logged in earlier clearing his/her data
  res.clearCookie("google-token");

  const inputpass = req.body.password;
  const inputmail = req.body.email;
  const datahere = signUpModel
    .findOne({ email: inputmail })
    .then(async (data) => {
      try {
        if (!data) {
          return res.render("login", {
            sahiyagalat: true,
            errortype: "danger",
            msgtype: "OOps!",
            errormsg:
              "No user found with this email address... Sign Up instead..",
          });
        }
        const match = await bcrypt.compare(inputpass, data.password);
        let tokenhere = await data.generateToken(); //need to generate token again while signing up

        if (match) {
          if (!data.Emailverified) {
            return res.render("verifyemail", {
              Data: data.email,
            });
          }
          res.cookie("jwt", tokenhere, {
            httpOnly: true,
          }); //adding only after email is verified so that secret pages cannot be accessed
          return res.redirect("/demo");
        } else {
          res.status("404").render("login", {
            sahiyagalat: true,
            errortype: "danger",
            msgtype: "Oops!",
            errormsg: "Wrong credentials",
          });
        }
      } catch (error) {
        res.status(401).render("login", {
          sahiyagalat: true,
          errortype: "warning",
          msgtype: "OOps!",
          errormsg: "Unknown Error Occured...Please Try Again",
        });
        console.log(error);
      }
    })
    .catch((err) => {
      return res.render("login", {
        sahiyagalat: true,
        errortype: "danger",
        msgtype: "OOps!",
        errormsg:
          "Check credentials and try agian....if problem continues ,Contact Us",
      });
    });
});

module.exports = router;
