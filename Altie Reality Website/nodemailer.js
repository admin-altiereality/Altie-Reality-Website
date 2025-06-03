var nodemailer = require("nodemailer");
require("dotenv").config();
var sgTransport = require("nodemailer-sendgrid-transport");

//******************************************* */
//Sending Email for email verifcation
function SendEmail(user) {
  //here we use the send grid and nodemailer to send the mail
  const transporter = nodemailer.createTransport(
    sgTransport({
      auth: {
        api_key: process.env.SEND_GRID_API,
      },
    })
  );
  transporter
    .sendMail({
      from: [{ name: "Altie Reality", address: "admin@pathshalaxr.com" }],
      to: user.email,
      subject: "Email Verification",
      html: `<h2 style="color:black;">Hello ${user.name} </h2>
      <h3>Welcome to PathshalaXR</h3>
     
      <br>
      <img style="background:black;height:200px;width:100%;"src="https://www.pathshalaxr.com/assets/img/logo.png.png?h=0b6029570f2621a53f6f47079d479eb2" alt="Altie">
      <br>
      <br>
      <b style="color:black;">Click the  <a  href="https://www.pathshalaxr.com/verifyemail/${user.resettoken}">link</a> to verify your email.</b>
      <br>
      <h4>OR</h4>
      <br>
      <div style="color:black;">Open this link in your browser : </div>
      <div> https://www.pathshalaxr.com/verifyemail/${user.resettoken}</div>
      <b style="font-weight:bold; color:black;">Ignore if you didn't requested the link</b>`,
    })
    .then(() => {
      console.log("successfully sent the mail");
    })
    .catch((err) => console.log(err));
}

//***************************************** */
//Email sending for resetting password

function SendEmail2(user) {
  //here we use the send grid and nodemailer to send the mail
  const transporter = nodemailer.createTransport(
    sgTransport({
      auth: {
        api_key: process.env.SEND_GRID_API,
      },
    })
  );
  transporter
    .sendMail({
     from: [{ name: "Altie Reality", address: "admin@pathshalaxr.com" }],
      to: user.email,
      subject: "Reset Password",
      html: `<h2 style="color:black;">Hello ${user.name} </h2>
      <h3 style="color:black;">Here is a link to reset your password</h3>
      <br>
      <img style="background:black;height:200px;width:100%;"src="https://www.altiereality.com/assets/img/logo.png.png?h=0b6029570f2621a53f6f47079d479eb2" alt="Altie">
      <br>
      <br>
      <b style="color:black;">Click the  <a  href="https://www.pathshalaxr.com/resetpassword/${user.resetpasswordtoken}">link</a> to reset the password</b>
      <br>
      <h4>OR</h4>
      <br>
      <div style="color:black;">copy this link and paste in the browser</div>
      <div> https://www.pathshalaxr.com/resetpassword/${user.resetpasswordtoken}</div>
      <b style="font-weight:bold; color:black;">Ignore if you didn't requested the link</b>`,
    })
    .then(() => {
      console.log("successfully sent the mail2");
    })
    .catch((err) => console.log(err));}
// ***********Email to the owner that new user has signed up

function SendEmail3(user) {
  //here we use the send grid and nodemailer to send the mail
  const transporter = nodemailer.createTransport(
    sgTransport({
      auth: {
        api_key: process.env.SEND_GRID_API,
      },
    })
  );
  transporter
    .sendMail({
      from: [{ name: "Altie Reality", address: "admin@pathshalaxr.com" }],
      to: "info.altiereality@gmail.com",
      subject: "New User Signed Up",
      html: `<h4>We've got new user on our website </h4>
      <div>Name: ${user.name}</div><div> Email: ${user.email}</div> <div>Mobile: ${user.number}</div>`,
    })
    .then(() => {
      console.log("successfully sent the mail3");
    })
    .catch((err) => console.log(err));
}
module.exports = {
  SendEmail,
  SendEmail2,
  SendEmail3,
};
