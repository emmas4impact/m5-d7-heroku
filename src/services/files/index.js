
const express = require("express")
const { join } = require("path")
const sgMail = require("@sendgrid/mail")
const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const exploreFolders = require("./explore-folders");
const { readDB } = require("../../utilities");

const filesRouter = express.Router()

//



filesRouter.get("/", async (req, res, next) => {
  try {
    const publicFolderPath = join(__dirname, "../../../public")
    const response = await exploreFolders(publicFolderPath)
    res.send(response)
  } catch (error) {
    next(error)
  }
})

filesRouter.post("/sendEmail", async (req, res, next) => {
  
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const msg = {
      to: "emmans4destiny@gmail.com",
      from: "segun@emma.org",
      subject: "You know what time it is",
      text: "and easy to do anywhere, even with Node.js",
      html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    
    }

    await sgMail.send(msg)
    res.send("sent")
  } catch (error) {
    next(error)
  }
})

module.exports = filesRouter