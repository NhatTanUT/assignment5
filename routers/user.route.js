const router = require('express').Router()
const UserController = require('../controllers/user.controller')
const {validateBody} = require('../middlewares/validate')
const auth = require('../middlewares/auth')

router.post('/login', validateBody("userSchema"), UserController.login)
router.post('/signup', validateBody("userSchema"), UserController.signup)

router.get('/getUserInfo', auth, UserController.getUserInfo)

router.post('/forgotPassword', validateBody("userSchema"), UserController.forgotPassword)

router.post('/resetPassword', validateBody("userSchema"), UserController.resetPassword)
module.exports = router