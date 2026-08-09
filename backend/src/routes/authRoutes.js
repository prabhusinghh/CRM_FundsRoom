const express = require('express');
const router = express.Router();

const { login, me } = require('../controllers/authController');
const { loginValidation } = require('../validators/authValidator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

router.post('/login', loginValidation, validate, login);
router.get('/me', authenticate, me);

module.exports = router;
