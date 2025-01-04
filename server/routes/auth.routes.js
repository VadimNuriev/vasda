const Router = require('express');
// Подключение Express
const bcrypt = require('bcrypt');
//Подключение модуля шифрования
const jwt = require('jsonwebtoken');
//Подключение jwt
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
//импорт
const authMiddleware = require('../middleware/auth.middleware');
// Подключение модуля Middleware для обмена запросами клиентской и серверной части
const fileService = require('../services/fileService');
const File = require('../models/File');
// Подключение необходимых модулей
const router = new Router();
// Определяем Router

router.post(
  '/registration',
  [
    check('email', 'Некорректный email').isEmail(),
    check('password', 'Пароль должен быть длиннее 3 символов и короче 12').isLength({ min: 3, max: 12 }),
  ],
  //валидация
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Некорректный запрос', errors });
      }
//условие неккоректного запроса, имеется ошибка
      const { email, password } = req.body;
      const candidate = await User.findOne({ email });

      if (candidate) {
        return res.status(400).json({ message: `Пользователь с таким ${email} уже существует` });
      }
//условие проверки на наличие пользователя
      const hashPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashPassword });
//хэширование пароля
      await user.save();
      await fileService.createDir(new File({ user: user.id, name: '' }));
//сохранение пользователя и создание его директории в файловом хранилище
      return res.json({ message: 'Пользователь зарегистрирован успешно' });
    } catch (error) {
      console.log(error);
      res.send({ message: 'Server is broke' });
      //информация что при запросе произошла ошибка
    }
  },
);

router.post('/login', async (req, res) => {
  try {
    
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
//блок кода, идентификация пользователя, в случае если в базе данных нет указанного пользователя - выводится ошибка
    const isPassValid = bcrypt.compareSync(password, user.password);
    if (!isPassValid) {
      return res.status(400).json({ message: 'Пароль не совпадает' });
    }
//Ошибка при проверке пароля
    const token = jwt.sign({ id: user.id }, config.get('secretKey'), { expiresIn: '5h' });
//создание токена доступа jwt с указанием параметров - expiresIn - время действия токена 5 часов.
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        diskSpace: user.diskSpace,
        usedSpace: user.usedSpace,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log(error);
    res.send({ message: 'Server is broke' });
  }
});

router.get(
  '/auth',
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.user.id });
      const token = jwt.sign({ id: user.id }, config.get('secretKey'), { expiresIn: '5h' });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          diskSpace: user.diskSpace,
          usedSpace: user.usedSpace,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.log(error);
      res.send({ message: 'Server is broke' });
    }
  },
);

module.exports = router;
// После определения всех маршрутов выполняем их экспорт.
