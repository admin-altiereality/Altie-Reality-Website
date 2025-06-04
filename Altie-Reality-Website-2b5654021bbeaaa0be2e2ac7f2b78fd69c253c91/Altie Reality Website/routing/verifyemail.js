const { SendEmail, SendEmail2 } = require("../nodemailer");
const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const signUpModel = require("../mongooseschema").signUpModel;

router.get("/verifyemail/:token", (req, res) => {
    signUpModel
        .findOne({ resettoken: req.params.token })
        .then((user) => {
            if (!user) {
                return res.render("login", {
                    sahiyagalat: true,
                    errortype: "success",
                    msgtype: null,
                    errormsg: "Already verified. Sign in to continue.",
                });
            }
            user.Emailverified = true;
            user.resettoken = undefined;
            user
                .save()
                .then((updateddata) =>
                    res.render("login", {
                        sahiyagalat: true,
                        errortype: "success",
                        msgtype: "Voila!",
                        errormsg: "Successfully verified email.Login to continue.",
                    })
                )
                .catch((err) => console.log("unable to save updateddata"));
        })
        .catch((err) => {
            console.log(err);
            return res.json({ error: "pathshalaXR did some mistake. Please try again. " });
        });
});

router.get("/resendemail/:email", (req, res) => {
    signUpModel
        .findOne({ email: req.params.email })
        .then((user) => {
            if (!user) {
                return res.render("login", {
                    sahiyagalat: true,
                    errortype: "warning",
                    msgtype: "OOps!",
                    errormsg: "pathshalaXR did some mistake. Please try again.",
                });
            }
            SendEmail(user);
            return res.render("verifyemail", {
                Data: user.email,
                sahiyagalat: true,
                errortype: "success",
                msgtype: "Ok",
                errormsg: " Almost there, pathshalaXR sent you a mail.  ",
            });
        })
        .catch((err) =>
            res.render("login", {
                sahiyagalat: true,
                errortype: "warning",
                msgtype: "Sorry!",
                errormsg: "pathshalaXR wasn't ready. Please Try Again ",
            })
        );
});
module.exports = router;