const express = require("express")
const { check, validationResult, sanitizeBody } = require("express-validator")
const path = require("path")
const { readDB, writeDB } = require("../../utilities")
const attendeesRouter = express.Router()
const uniqid= require("uniqid")
const { Transform } = require("json2csv")
const multer = require("multer")
const { join } = require("path")
const sgMail = require("@sendgrid/mail")
const fs = require("fs-extra")
const attendeeJsonPath = path.join(__dirname, "attendees.json")
const pump = require("pump")
const PdfPrinter = require("pdfmake")

attendeesRouter.get("/", async (req, res, next)=>{
    try {
        const data = await readDB(attendeeJsonPath )
    
        res.send(data)
      } catch (error) {
        console.log(error)
        const err = new Error("While reading books list a problem occurred!")
        next(err)
      }
    
    
})
attendeesRouter.post("/",  [
   
    check("firstname").exists().withMessage("Title is required"),
    check("surname").exists().withMessage("Category is required"),
    check("email").exists(),
    check("Arrivaltime").exists()
  ], async(req, res, next)=>{
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error()
      error.httpStatusCode = 400
      error.message = errors
      next(error)
    }
    
    try {
      function base64_encode(file) {
        var bitmap = fs.readFileSync(file);
        return new Buffer(bitmap).toString("base64");
      }
        const attendee= await readDB(attendeeJsonPath)
        const newAttendee ={
            Id: uniqid(),
            ...req.body
            }
        
        attendee.push(newAttendee)
        await writeDB(attendeeJsonPath, attendee);
        res.status(201).send("party atendee Created");
        
        var fonts ={
          Roboto:{
            normal:"fonts/Roboto-Regular.ttf",
          }
        }
        var printer = new PdfPrinter(fonts);
        const docDefinition ={
          content:[
            (id= "Ticket: " + newAttendee.Id),
            (firstname= "Ticket: " + newAttendee.firstname),
            (email= "Ticket: " + newAttendee.email),
            (Arrivaltime = "Arrivaltime: " + newAttendee.Arrivaltime)
            
          ]
        }
        var pdfDoc =printer.createPdfKitDocument(docDefinition)
        pdfDoc.pipe(fs.createWriteStream(`src/services/Pdfs/${newAttendee.Id}.pdf`))
        pdfDoc.end();
        
        //attachment
        pathToAttachment =`${__dirname}/../Pdfs/${newAttendee.Id}.pdf`
        fs.readFile(pathToAttachment, async function(err, data){
          if(data){
            sgMail.setApiKey(process.env.SENDGRID_API_KEY)
            const data_64 = base64_encode(pathToAttachment)
            
            const msg ={
              to: "emmans4destiny@gmail.com",
              from: "segun@emma.org",
              subject: "Welcome to the Party!",
              text: "Please keep to time no African time please!",
              
              attachments:[{
                content: data_64,
                filename: newAttendee.Id,
                type: "application/pdf"
                
                
              },
                
              ],
            };
            sgMail.send(msg)
            .then((response)=>{
              res.send("suceess")
              
            }).catch((err)=>{
              res.send(err)
            })
          }
          //sgMail.send(msg)
          
        })
      } catch (error) {
        console.log(error)
        const err = new Error("While reading attendee list a problem occurred!")
        next(err)
      }
      
    
})

attendeesRouter.get("/export/csv", (req, res, next) => {
    try {
      const paths = join(__dirname, "attendees.json")
      const jsonReadableStream = fs.createReadStream(paths)
  
      const json2csv = new Transform({
        fields: ["Id", "firstname", "surname", "email", "Arrivaltime"],
      })
  
      res.setHeader("Content-Disposition", "attachment; filename=export.csv")
      pump(jsonReadableStream, json2csv, res, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log("Done")
        }
      })
    } catch (error) {}
  })

module.exports = attendeesRouter