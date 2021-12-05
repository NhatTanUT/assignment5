const bcrypt = require("bcrypt");
const { Users } = require("../models/User.model");
const { createAccessToken } = require("../helper/createToken");
const { sendMail } = require("../helper/mailer");
const {randomBytes} = require('crypto')
const Otps = require('../models/otp.model')

class UserController {
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Check email exist
            const user = await Users.findOne({ email: email });

            if (!user)
                return res
                    .status(401)
                    .json({ msg: "This email does not exist." });

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(401).json({ msg: "Password is incorrect." });

            // Create token
            const access_token = createAccessToken({ id: user._id });

            return res.json({
                msg: "Login Success!",
                access_token,
                user: {
                    ...user._doc,
                    password: "",
                },
            });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    }
    async signup(req, res) {
        try {
            const { email, password, confirmPassword } = req.body;
            // let newEmail = email.toLowerCase() // /g replace remove first element. /g to remove all (purpose: remove space)

            // Check have password
            if (!confirmPassword)
                return res
                    .status(400)
                    .json({ msg: "Must have confirm password. " });
            if (!password)
                return res.status(400).json({ msg: "Must have password. " });

            // Find user exist by email
            const foundEmail = await Users.findOne({ email: email });
            if (foundEmail)
                return res
                    .status(400)
                    .json({ msg: "This email already registered. " });

            // if (password.length < 6)
            //     return res
            //         .status(400)
            //         .json({ msg: "Password must be at least 6 characters." });

            // Update password
            const passwordHash = await bcrypt.hash(password, 12);

            const newUser = new Users({
                email: email,
                password: passwordHash,
            });

            // const access_token = createAccessToken({ id: newUser._id });

            await newUser.save();

            return res.json({
                msg: "Register Success! ",
                // access_token,
                user: {
                    ...newUser._doc,
                    password: "",
                },
            });
        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }
    }

    async getUserInfo(req, res) {
        try {
            const userId = req.user._id;
            const foundUser = await Users.findOne({ _id: userId });

            if (!foundUser)
                return res.status(400).json({ msg: "Not found user" });

            return res.status(200).json(foundUser);
        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }
    }
    async forgotPassword(req, res) {
        try {
            const {email} = req.body
            // console.log(req.header('host'));

            // Validate
            const foundUser = await Users.findOne({ email: email }).lean();
            if (!foundUser) {
                return res.status(400).json({msg: "Not found email!"})
            }

            const otp = randomBytes(4).toString('hex');
            
            // Create expire time
            let date = new Date()
            // console.log(date);
            date.setTime(date.getTime() + (15*60*1000))
            // console.log(date);

            // Create otp
            const newOtp = new Otps({
                otp,
                userId: foundUser._id,
                expire: date,
                isUsed: false
            })

            await newOtp.save()

            const to = foundUser.email;
            const subject = "Reset password";
            const body = `
      <!doctype html>
      <html lang="en-US">
      
      <head>
          <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
          <title>Reset Password Email Template</title>
          <meta name="description" content="Reset Password Email Template.">
          <style type="text/css">
              a:hover {text-decoration: underline !important;}
          </style>
      </head>
      
      <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
          <!--100% body table-->
          <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
              style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
              <tr>
                  <td>
                      <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                          align="center" cellpadding="0" cellspacing="0">
                          <tr>
                              <td style="height:80px;">&nbsp;</td>
                          </tr>
                          <tr>
                              <td style="text-align:center;">
                                <a href="https://web-demo.online" title="logo" target="_blank">
                                  <i class="fas fa-fire"></i>
                                </a>
                              </td>
                          </tr>
                          <tr>
                              <td style="height:20px;">&nbsp;</td>
                          </tr>
                          <tr>
                              <td>
                                  <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                      style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                      <tr>
                                          <td style="height:40px;">&nbsp;</td>
                                      </tr>
                                      <tr>
                                          <td style="padding:0 35px;">
                                              <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have
                                                  requested to reset your password</h1>
                                              <span
                                                  style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                              <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                  We cannot simply send you your old password. A unique otp to reset your
                                                  password has been generated for you. To reset your password, copy otp and paste in reset password page.
                                              </p>
                                              <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                  OTP will expire after 15 minutes
                                              </p>
                                              <a 
                                                  style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">
                                                  ${otp}</a>
                                                
                                          </td>
                                      </tr>
                                      <tr>
                                          <td style="height:40px;">&nbsp;</td>
                                      </tr>
                                  </table>
                              </td>
                          <tr>
                              <td style="height:20px;">&nbsp;</td>
                          </tr>
                          <tr>
                              <td style="text-align:center;">
                                  <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>No Copyright@2021</strong></p>
                              </td>
                          </tr>
                          <tr>
                              <td style="height:80px;">&nbsp;</td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
          <!--/100% body table-->
      </body>
      
      </html>`;

            // Send mail
            await sendMail(to, subject, body);

            return res.json({msg: "Send to email :" + email})
        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }
    }
    async resetPassword(req, res) {
        try {
            let {otp, password, confirmPassword} = req.body
            // console.log(otp);
            otp = otp.toLowerCase()

            // Validate otp
            if (password !== confirmPassword) {
                return res.status(400).json({msg: "Confirm password is not equal to password"})
            }
            const date = new Date()
            const foundOtp = await Otps.findOne({otp})

            if (!foundOtp) return res.status(401).json({msg: "Invalid otp."})

            if (foundOtp.expire < date) {
                return res.status(401).json({msg: "Otp expired"})
            } 
            
            if (foundOtp.isUsed === true) {
                return res.status(401).json({msg: "Use only otp 1 time"})
            }

            // Update password
            const foundUser = await Users.findById(foundOtp.userId)

            const passwordHash = await bcrypt.hash(password, 12);

            foundUser.password = passwordHash

            await foundUser.save()

            // Update otp (isUsed: true)
            foundOtp.isUsed = true
            await foundOtp.save()

            return res.status(200).json({msg: "Reset password successfully"})
            
        } catch (error) {
            return res.status(400).json({ msg: error.message });
            
        }
    }
}

module.exports = new UserController();
