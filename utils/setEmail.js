import nodemailer from "nodemailer";

export const sendEmail = (options) => {
  let nodemailers = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
      user: "khagijora2074@gmail.com",
      pass: "gkdjojpbrdixzyjk",
    },
  });
  const mailOptions = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  nodemailers.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error", error);
    } else {
      console.log("Email Sent", info.response);
    }
  });
};
