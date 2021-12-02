const nodeMailer = require("nodemailer");

// Use google STMP service to send mail
const adminEmail =
  "mailer.plsnoreply@gmail.com";
const adminPassword =
  process.env.MAILERPASSWORD;

const mailHost = "smtp.gmail.com";
const mailPort = 587;

const sendMail = (to, subject, htmlContent) => {
  // Create transporter
  const transporter = nodeMailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: false, 
    auth: {
      user: adminEmail,
      pass: adminPassword,
    },
  });

  const options = {
    from: adminEmail, 
    to: to, // mail account want to send
    subject: subject, 
    html: htmlContent, 
  };

  return transporter.sendMail(options);
};

module.exports = {
  sendMail: sendMail,
};
