const bcrypt = require("bcrypt");
const mongoose = require('mongoose')
const createError = require('http-errors')

const Users = require("../models/User.model");
const Otps = require('../models/otp.model')
const { createAccessToken } = require("../helper/createToken");
const { sendMail } = require("../helper/mailer");
const {randomBytes} = require('crypto')

class UserController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Check email exist
            const user = await Users.findOne({ email: email });

            if (!user)
                return next(createError(400, "This email does not exist.")) 

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return next(createError(401, "Password is incorrect.")) 

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
            next(createError(400, error.message))
        }
    }
    async signup(req, res, next) {
        try {
            const { email, password, confirmPassword } = req.body;
            // let newEmail = email.toLowerCase() // /g replace remove first element. /g to remove all (purpose: remove space)

            // Check have password
            if (!confirmPassword)
                return next(createError(400, "Must have confirm password. "))

            if (!password)
                return next(createError(400, "Must have password. "))


            // Find user exist by email
            const foundEmail = await Users.findOne({ email: email });
            if (foundEmail)
                return next(createError(400, "This email already registered. "))

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
            return next(createError(400, error.message))
        }
    }

    async getUserInfo(req, res, next) {
        try {
            const userId = req.user._id;
            const foundUser = await Users.findOne({ _id: userId });

            if (!foundUser)
                return next(createError(400, "Not found user"))

            return res.status(200).json(foundUser);
        } catch (error) {
            return next(createError(400, error.message))
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const {email} = req.body

            // Validate
            const foundUser = await Users.findOne({ email: email }).lean();
            if (!foundUser) {
                return next(createError(400, "Not found email!"))
            }

            const otp = randomBytes(4).toString('hex');
            
            // Create expire time from date.now()
            let date = new Date()
            // console.log(date);

            // Check OTP exist
            const foundOtp = await Otps.findOne({userId: mongoose.Types.ObjectId(foundUser._id)})
            if (foundOtp) {
                const updateOtp = await Otps.updateOne({userId: mongoose.Types.ObjectId(foundUser._id)}, {$set: {otp: otp}})

                if (updateOtp.matchedCount === 0) {
                    return next(createError(400, "Cant update otp"))
                }
            }
            else {
                // Create otp
                const newOtp = new Otps({
                    otp,
                    userId: foundUser._id,
                    expire: date
                })
    
                await newOtp.save()
            }

            // To, Subject, Body Mail
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
                                                  OTP will expire after 1 minutes
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

            return res.status(200).json({msg: "Send to email :" + email})
        } catch (error) {
            return next(createError(400, error.message))
        }
    }
    async resetPassword(req, res, next) {
        try {
            let {otp, email, password, confirmPassword} = req.body
            // console.log(otp);
            otp = otp.toLowerCase()

            // Validate otp
            if (password !== confirmPassword) {
                return next(createError(400, "Confirm password is not equal to password"))
            }
            
            // Find Otp
            const foundOtp = await Otps.findOne({otp})

            if (!foundOtp) return next(createError(401, "Invalid otp or otp expired. Please reset again. "))

            const foundUser = await Users.findById(foundOtp.userId)

            if (!foundUser) return next(createError(400, "Cant find userId"))

            // Check email 
            if (email !== foundUser.email) {
                return next(createError(400, 'Email is incorrect. '))
            }

            // Update password
            const passwordHash = await bcrypt.hash(password, 12);

            foundUser.password = passwordHash

            await foundUser.save()

            return res.status(200).json({msg: "Reset password successfully"})
            
        } catch (error) {
            return next(createError(400, error.message))
            
        }
    }
}

module.exports = new UserController();
