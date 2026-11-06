const express = require("express");
const userController = require("../controller/userController");
const bookController = require("../controller/bookController");
const authMiddleware = require("../Middlewares/authMiddleware");
const multerMiddleware=require("../Middlewares/multerMiddleware")
const adminAuthMiddleware=require("../Middlewares/adminAuthMiddleware")


//to set up routed outside express server, create object for Router class in express
const router = new express.Router();

//register
router.post("/register", userController.registerController);
router.post("/login", userController.loginController);
router.post("/google-login", userController.googleLogin);
router.get('/homebooks',bookController.getHomePageBookController)

//---------authorized user----------------
router.put("/user/edit/:id",authMiddleware,multerMiddleware.single('picture'), userController.userEditController);
router.post("/add-book",authMiddleware,multerMiddleware.array('uploadImages',3),bookController.addBookController);
router.get('/all-books',authMiddleware,bookController.getBooksPageBookController)
router.get('/user-books',authMiddleware,bookController.getUserBookController)
router.get('/bought-books',authMiddleware,bookController.getUserBoughtBookController)
router.get('/single-book/:id',authMiddleware,bookController.getSingleBookController)
//get book via ai
router.post('/book-ai',authMiddleware,bookController.generateBookAbstractController)
router.delete('/remove-book/:id',authMiddleware,bookController.removeBookController)
router.get('/make-payment/:id',authMiddleware,bookController.bookpaymentController)
router.post('/verify-payment',bookController.verifyPaymentController)

//---------------------admin-----------------------------
router.get('/books',adminAuthMiddleware,bookController.getAllBooksController)
router.put('/book-update/:id',adminAuthMiddleware,bookController.approvedBooksController)
router.get('/all-users',adminAuthMiddleware,userController.getAllUserController)

module.exports = router;
