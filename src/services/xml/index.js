const express = require("express")
const {xml2js} = require("xml-js")
const axios =require("axios")
const { begin } = require("xmlbuilder")

const xmlRouter = express.Router()

xmlRouter.get('/', async (req, res, next)=>{
    const {ip} = req.query
    
    try {
        const response = await axios.get(`http://www.geoplugin.net/xml.gp?ip=${ip}`)
        const xml = response.data
        
        const parsedJS =xml2js(xml, {compact: true})
        res.send(parsedJS)
        
    } catch (error) {
       next(error) 
    }
})

xmlRouter.get("/convertLowerCaseWithToken", async (req, res, next) => {
    try {
      const { string, token } = req.query
  
      if (string && token) {
        const xmlRequest = begin({
          version: "1.0",
          encoding: "utf-8",
        })
          .ele("soap:Envelope", {
            "xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
          })
          .ele("soap:Body")
          .ele("AllLowercaseWithToken", {
            xmlns: "http://www.dataaccess.com/webservicesserver/",
          })
          .ele("sAString")
          .text(string)
          .up()
          .ele("sToken")
          .text(token)
          .end()
  
        const response = await axios({
          method: "post",
          url:
            "https://www.dataaccess.com/webservicesserver/TextCasing.wso?op=AllLowercaseWithToken",
          data: xmlRequest,
          headers: { "Content-type": "text/xml" },
        })
        res.send(response.data)
      } else {
        next(new Error("Please send string & token as query parameters"))
      }
    } catch (error) {
      next(error)
    }
  })
 
module.exports=xmlRouter