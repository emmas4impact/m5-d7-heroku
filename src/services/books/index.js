const express = require("express")
const path = require("path")
const { check, validationResult, sanitizeBody } = require("express-validator")
const fs = require("fs-extra")
const uniqid = require("uniqid")
const multer = require("multer")
const { join } = require("path")
const { readDB, writeDB } = require("../../utilities")
const x = require("uniqid")
const {xml2js} = require("xml-js")
const axios =require("axios")
const { begin } = require("xmlbuilder")

const booksJsonPath = path.join(__dirname, "books.json")
const commentsJsonPath = path.join(__dirname, "comments.json")

const booksFolder = join(__dirname, "../../../public/img/books/")
const upload = multer({})
const booksRouter = express.Router()

booksRouter.get("/", async (req, res, next) => {
  try {
    const data = await readDB(booksJsonPath)

    res.send({ numberOfItems: data.length, data })
  } catch (error) {
    console.log(error)
    const err = new Error("While reading books list a problem occurred!")
    next(err)
  }
})

booksRouter.get("/:asin", async (req, res, next) => {
  try {
    const books = await readDB(booksJsonPath)
    const book = books.find((b) => b.asin === req.params.asin)
    if (book) {
      res.send(book)
    } else {
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    console.log(error)
    next("While reading books list a problem occurred!")
  }
})

booksRouter.post(
  "/",
  [
    check("asin").exists().withMessage("You should specify the asin"),
    check("title").exists().withMessage("Title is required"),
    check("category").exists().withMessage("Category is required"),
    check("img").exists().withMessage("Img is required"),
    sanitizeBody("price").toFloat(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error()
      error.httpStatusCode = 400
      error.message = errors
      next(error)
    }
    try {
      const books = await readDB(booksJsonPath)
      const asinCheck = books.find((x) => x.asin === req.body.asin) //get a previous element with the same asin
      if (asinCheck) {
        //if there is one, just abort the operation
        const error = new Error()
        error.httpStatusCode = 400
        error.message = "ASIN should be unique"
        next(error)
      } else {
        books.push(req.body)
        await writeDB(booksJsonPath, books)
        res.status(201).send("Created")
      }
    } catch (error) {
      next(error)
    }
  }
)

booksRouter.put("/:asin", async (req, res, next) => {
  try {
    const books = await readDB(booksJsonPath)
    const book = books.find((b) => b.asin === req.params.asin)
    if (book) {
      const position = books.indexOf(book)
      const bookUpdated = { ...book, ...req.body } // In this way we can also implement the "patch" endpoint
      books[position] = bookUpdated
      await writeDB(booksJsonPath, books)
      res.status(200).send("Updated")
    } else {
      const error = new Error(`Book with asin ${req.params.asin} not found`)
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    next(error)
  }
})

booksRouter.delete("/:asin", async (req, res, next) => {
  try {
    const books = await readDB(booksJsonPath)
    const book = books.find((b) => b.asin === req.params.asin)
    if (book) {
      await writeDB(
        booksJsonPath,
        books.filter((x) => x.asin !== req.params.asin)
      )
      res.send("Deleted")
    } else {
      const error = new Error(`Book with asin ${req.params.asin} not found`)
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    next(error)
  }
})

booksRouter.post("/upload", upload.single("avatar"), async (req, res, next) => {
  try {
    await fs.writeFile(
      join(booksFolder, req.file.originalname),
      req.file.buffer
    )
  } catch (error) {
    next(error)
  }
  res.send("OK")
})

booksRouter.get("/:asin/comments", async(req, res, next)=>{
  try {
    const comments = await readDB(commentsJsonPath)
    
    res.send(comments)
  } catch (error) {
    console.log(error)
    const err = new Error("While reading books list a problem occurred!")
    next(err)
  }
})

booksRouter.get("/:asin/comments/:CommentID", async(req, res, next)=>{
  try {
    const commentDb = await readDB(commentsJsonPath)
    const commentFilterd = commentDb.find((c)=> c.CommentID===req.params.CommentID)
    if(commentFilterd ){
      res.send(commentFilterd )
    }else{
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
   // res.send(commentFilterd)
  } catch (error) {
    console.log(error)
    next("While reading comment list a problem occurred!")
  }
  
})

booksRouter.post("/:asin/comments", async(req, res, next)=>{
  try {
    const comments = await readDB(commentsJsonPath)
    const newComment ={...req.body, CommentID:uniqid(), BookId: req.params.asin, createdAt: new Date() }
    
    comments.push(newComment)
    await writeDB(commentsJsonPath, comments )
    res.status(201).send("Comment Created")
    
  } catch (error) {
    console.log(error)
    const err = new Error("While reading comment list a problem occurred!")
    next(err)
  }
  
  
})
booksRouter.delete("/:asin/comments/:CommentID", async(req, res, next)=>{
  try {
    const commentDb = await readDB(commentsJsonPath)
    const commentFilterd = commentDb.find((c)=> c.CommentID===req.params.CommentID)
    if(commentFilterd ){
      await writeDB(commentsJsonPath, commentDb.filter((x) => x.CommentID !== req.params.CommentID))
      res.send("Deleted")
    }else{
      const error = new Error(`Book with asin ${req.params.CommentID} not found`)
      error.httpStatusCode = 404
      next(error)
    }
   // res.send(commentFilterd)
  } catch (error) {
    console.log(error)
    next("While reading books list a problem occurred!")
  }
  
})

booksRouter.get("/xml/sumTwoPrices", async (req, res, next) => {
  try {
    const data = await readDB(booksJsonPath)
    const bookA = data.filter(book => book.asin === req.query.intA || book.asin === req.query.intB )
    const priceA = bookA.map(book => book.price)
    console.log(priceA[0])
   // const bookB = data.filter(book => book.asin === req.query.intB)
   // const priceB = bookB.map(book => book.price)
    //console.log(priceB[0])
  if (priceA[0] && priceA[1] ) {
    const xmlRequest = begin({
      version: "1.0",
      encoding: "utf-8",
    })
      .ele("soap12:Envelope", {
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
        "xmlns:soap12": "http://www.w3.org/2003/05/soap-envelope"
      })
      .ele("soap12:Body")
      .ele("Add", {
        xmlns: "http://tempuri.org/",
      })
      .ele("intA")
      .text(Math.round(priceA[0]))
      .up()
      .ele("intB")
      .text(Math.round(priceA[1]))
      .end()
    const response = await axios({
      method: "post",
      url:
        "http://www.dneonline.com/calculator.asmx?op=Add",
      data: xmlRequest,
      headers: { "Content-type": "application/soap+xml" },
    })
    res.send(response.data)
  } else {
    next(new Error("Please send 2 different prices as query parameters"))
  }
} catch (error) {
  next(error)
}
})

module.exports = booksRouter
