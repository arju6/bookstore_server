const books = require("../Models/bookModel");
const stripe = require("stripe")(process.env.STRIPEKEY);
const {GoogleGenerativeAI}=require('@google/generative-ai')

exports.addBookController = async (req, res) => {
    console.log("inside add book controller");

    const { title, author, pages, imageUrl, price, discountPrice, abstract, publisher, isbn, language, category } =
        req.body;

    const uploadImages = req.files.map((item) => item.filename);

    const sellerEmail = req.payload;

    console.log(
        title,
        author,
        pages,
        imageUrl,
        price,
        discountPrice,
        abstract,
        publisher,
        isbn,
        language,
        category,
        uploadImages,
        sellerEmail,
    );

    const existingBook = await books.findOne({ title, sellerEmail });
    if (existingBook) {
        res.status(409).json("Book already exist...operation denied");
    } else {
        const newBook = await books.create({
            title,
            author,
            pages,
            imageUrl,
            price,
            discountPrice,
            abstract,
            publisher,
            isbn,
            language,
            category,
            uploadImages,
            sellerEmail,
        });
        res.status(200).json(newBook);
    }
};

//get latest 4 books
exports.getHomePageBookController = async (req, res) => {
    console.log("inside getHomePageBookController");
    const homebooks = await books.find().sort({ _idL: -1 }).limit(4);
    res.status(200).json(homebooks);
};

//get all books apart from login user
exports.getBooksPageBookController = async (req, res) => {
    console.log("inside getBooksPageBookController");
    const loginUserMail = req.payload;
    const searchKey = req.query.search;
    const allbooks = await books.find({ sellerEmail: { $ne: loginUserMail }, title: { $regex: searchKey, $options: "i" } });
    res.status(200).json(allbooks);
};

//display book uploaded by login user
exports.getUserBookController = async (req, res) => {
    console.log("inside getUserBookController");
    const loginUserMail = req.payload;
    const userbooks = await books.find({ sellerEmail: loginUserMail });
    res.status(200).json(userbooks);
};

//get user bought books
exports.getUserBoughtBookController = async (req, res) => {
    console.log("inside getBoughtBookController");
    const loginUserMail = req.payload;
    const userboughtbooks = await books.find({ buyerEmail: loginUserMail });
    res.status(200).json(userboughtbooks);
};

//get single books
exports.getSingleBookController = async (req, res) => {
    console.log("inside getSingleBookController");
    const { id } = req.params;
    const bookDetails = await books.findById({ _id: id });
    res.status(200).json(bookDetails);
};

//remove book
exports.removeBookController = async (req, res) => {
    console.log("inside removeBookController");
    const { id } = req.params;
    const dltBook = await books.findByIdAndDelete({ _id: id });
    res.status(200).json(dltBook);
};

exports.bookpaymentController = async (req, res) => {
    console.log("inside bookpaymentController");
    const { id } = req.params;
    const loginUserMail = req.payload;
    const bookDetails = await books.findById({ _id: id });

    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: bookDetails.title,
                    },
                    unit_amount: Math.round(bookDetails.discountPrice * 100),
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        metadata: {
            bookID: id,
            buyerEmail: loginUserMail,
        },
        success_url: `https://book-store-frontend-zm89.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: "https://book-store-frontend-zm89.vercel.app/logincancel",
    });
    console.log(session);
    res.status(200).json({ checkoutURL: session.url });
};

exports.verifyPaymentController=async(req,res)=>{
    console.log("inside verifyPaymentController");
    const {sessionId}=req.body
    const session=await stripe.checkout.sessions.retrieve(sessionId)
    if(session.payment_status=='paid'){
        const bookid=session.metadata.bookID
        const email=session.metadata.buyerEmail

        const book=await books.findOne({_id:bookid})
        book.status='Sold'
        book.buyerEmail=email
        await book.save()
        res.status(200).json({message:"Payment Verified",book})
    }
    else{
        res.status(400).json("payement not completed")
    }
}

//get all books 
exports.getAllBooksController = async (req, res) => {
    console.log("inside getAllBooksController");
    const allbooks = await books.find();
    res.status(200).json(allbooks);
};


//update book status
exports.approvedBooksController = async (req, res) => {
    console.log("inside approvedBooksController");
    const {id}=req.params
    const book = await books.findById({_id:id});
    book.status='Approved'
    await book.save()
    res.status(200).json(book);
};

//get book abstract
exports.generateBookAbstractController=async(req,res)=>{
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : ""
    if (!title) {
        return res.status(400).json({ success: false, message: "Book title is required." })
    }

    if (!process.env.GEMINI_API) {
        return res.status(503).json({ success: false, message: "Gemini API is not configured on the server." })
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API)
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" })
        const result = await model.generateContent(`Give me a short abstract of the book "${title}" as plain text.`)
        const content = result.response.text().trim()

        if (!content) {
            return res.status(502).json({ success: false, message: "Gemini returned an empty abstract." })
        }

        return res.status(200).json({ success: true, content })
    } catch (error) {
        console.error("Gemini book abstract generation failed:", error instanceof Error ? error.message : String(error))
        return res.status(502).json({
            success: false,
            message: "Gemini could not generate an abstract. Check the server API key and try again.",
        })
    }
}