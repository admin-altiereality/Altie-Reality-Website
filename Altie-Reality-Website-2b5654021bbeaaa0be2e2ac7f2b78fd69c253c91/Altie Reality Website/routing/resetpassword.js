const { SendEmail, SendEmail2 } = require("../nodemailer");
const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const signUpModel = require("../mongooseschema").signUpModel;

router.get("/resetpassword", (req, res) => {
    res.render("resetpassword");
});

router.post("/sendresetlink", (req, res) => {
    if (!req.body.email) {
        return res.render("resetpassword", {
            sahiyagalat: true,
            errortype: "warning",
            msgtype: "Sorry!",
            errormsg: "Email Field Is Required",
        });
    }
    signUpModel.findOne({ email: req.body.email }).then((user) => {
        if (!user) {
            return res.render("resetpassword", {
                sahiyagalat: true,
                errortype: "warning",
                msgtype: "OOps!",
                errormsg: "pathshalaXR doesn't recongnize you. Sign Up to get started.",
            });
        } else {
            crypto.randomBytes(32, async function(err, buffer) {
                if (err) {
                    console.log(err);
                    res.send("error occured");
                } else {
                    let token = buffer.toString("hex");
                    user.resetpasswordtoken = token;
                    user.tokenexpiry = Date.now() + 1800000;
                    user
                        .save()
                        .then((user) => console.log("added resetpasswordtoken to database"))
                        .catch((err) => console.log(err));
                    SendEmail2(user);
                    res.render("resetpassword", {
                        sahiyagalat: true,
                        errortype: "success",
                        msgtype: "Ok!",
                        errormsg: "GO to your mail to reset password.",
                    });
                }
            });
        }
    });
});

router.get("/resetpassword/:token", (req, res) => {
    signUpModel
        .findOne({
            resetpasswordtoken: req.params.token,
            tokenexpiry: { $gt: Date.now() },
        })
        .then((user) => {
            if (!user) {
                res.render("login", {
                    sahiyagalat: true,
                    errortype: "warning",
                    msgtype: "OOps!",
                    errormsg: "Session Expired! Please Try Again.",
                });
            } else {
                console.log(user);
                res.render("newpassword.hbs", {
                    resetpasswordtoken: user.resetpasswordtoken,
                });
            }
        })
        .catch((err) => console.log(err));
});

router.post("/newpassword/:token", (req, res) => {
    signUpModel.findOne({ resetpasswordtoken: req.params.token }).then((user) => {
        if (!user) {
            return res.render("login", {
                sahiyagalat: true,
                errortype: "warning",
                msgtype: "OOps!",
                errormsg: "pathshalaXR session expired. Login again.",
            });
        } else if (req.body.password === "") {
            return res.render("newpassword", {
                resetpasswordtoken: user.resetpasswordtoken,
                sahiyagalat: true,
                errortype: "warning",
                msgtype: null,
                errormsg: "pathshalaXR needs a password.",
            });
        } else if (req.body.password !== req.body.confirmpassword) {
            return res.render("newpassword", {
                resetpasswordtoken: user.resetpasswordtoken,
                sahiyagalat: true,
                errortype: "warning",
                msgtype: "OOps!",
                errormsg: "Password does not match.",
            });
        }
        let resetpasswordtokentemp = user.resetpasswordtoken; //doing this cause if the characters is less than 8 then it will go to catch block and then again if we put any value of password our page will need user.resetpasswordtoken which we are setting undefined in first attempt (when pass is less than 8 char )..hence shows error
        user.password = req.body.password;
        user.resetpasswordtoken = undefined;
        user.tokenexpiry = undefined;
        user
            .save()
            .then((updateduser) => {
                res.render("login", {
                    sahiyagalat: true,
                    errortype: "success",
                    msgtype: null,
                    errormsg: "Password Updated. You can now Sign in.",
                });
            })
            .catch((err) => {
                console.log(err);
                console.log(user + "this is user after err");
                res.render("newpassword", {
                    resetpasswordtoken: resetpasswordtokentemp,
                    sahiyagalat: true,
                    errortype: "warning",
                    msgtype: null,
                    errormsg: "Password must be atleast 8 characters long",
                });
            });
    });
});
module.exports = router;