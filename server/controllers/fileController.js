/* eslint-disable max-len */
const config = require('config');
const fs = require('fs');
const Uuid = require('uuid');
const fileService = require('../services/fileService');
const File = require('../models/File');
const User = require('../models/User');

class FileController {
  async createDir(req, res) {
    try {
      const { name, type, parent } = req.body;
      const file = new File({
        name, type, parent, user: req.user.id,
      });

      const parentFile = await File.findOne({ _id: parent });

      if (!parentFile) {
        file.path = name;
        await fileService.createDir(file);
      } else {
        file.path = `${parentFile.path}/${file.name}`; 
        await fileService.createDir(file);
        parentFile.childs.push(file._id);
        await parentFile.save();
      }

      await file.save();
      return res.json(file);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  }

  async getFiles(req, res) {
    try {
      const { sort } = req.query;
      let files;

      switch (sort) {
        case 'name':
          files = await File.find({ user: req.user.id, parent: req.query.parent }).sort({ name: 1 });
          break;

        case 'type':
          files = await File.find({ user: req.user.id, parent: req.query.parent }).sort({ type: 1 });
          break;

        case 'date':
          files = await File.find({ user: req.user.id, parent: req.query.parent }).sort({ date: 1 });
          break;

        default:
          files = await File.find({ user: req.user.id, parent: req.query.parent });
          break;
      }

      return res.json(files);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Нет такого файла' });
    }
  }

  async uploadFile(req, res) {
    try {
      const { file } = req.files; // TODO: проверить деструктуризацию, сделать req.files.file
      const parent = await File.findOne({ user: req.user.id, _id: req.body.parent });
      const user = await User.findOne({ _id: req.user.id });
      let filePath = file.name;
      let path;

      if (user.usedSpace + file.size > user.diskSpace) {
        return res.status(400).json({ message: 'На диске не хватает свободного места' });
      }

      user.usedSpace += file.size;

      if (parent) {
        path = `${config.get('filePath')}/${user._id}/${parent.path}/${file.name}`;
        filePath = `${parent.path}/${file.name}`;
      } else {
        path = `${config.get('filePath')}/${user._id}/${file.name}`;
      }

      if (fs.existsSync(path)) {
        return res.status(400).json({ message: 'Такой файл уже загружен' });
      }

      await file.mv(path); 

      const type = file.name.split('.').pop();

      const dbFile = new File({
        name: file.name,
        type,
        size: file.size,
        path: filePath,
        parent: parent?._id,
        user: user._id,
      });

      await dbFile.save();
      await user.save();

      res.json(dbFile);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Ошибка загрузки' });
    }
  }

  async downloadFile(req, res) {
    try {
      const file = await File.findOne({ _id: req.query.id, user: req.user.id });
      // const path = `${config.get('filePath')}/${req.user.id}/${file.path}`;
      const path = fileService.getPath(file);

      if (fs.existsSync(path)) {
        return res.download(path, file.name);
      }

      return res.status(400).json({ message: 'Ошибка скачивания' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Ошибка скачивания' });
    }
  }

  async deleteFile(req, res) {
    try {
      const file = await File.findOne({ _id: req.query.id, user: req.user.id });

      if (!file) {
        return res.status(400).json({ message: 'Файл не найден' });
      }

      fileService.deleteFile(file);
      await file.remove();

      return res.json({ message: 'Файл удален' });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Папка не пуста, удалите файлы перед удалением папки' });
    }
  }

  async searchFile(req, res) {
    try {
      const searchFile = req.query.search;

      let files = await File.find({ user: req.user.id });
      files = files.filter((file) => file.name.toLowerCase().includes(searchFile.toLowerCase()));

      return res.json(files);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Ошибка поиска' });
    }
  }

  async uploadAvatar(req, res) {
    try {
      const { file } = req.files; // TODO: проверить деструктуризацию, сделать req.files.file
      const user = await User.findOne({ _id: req.user.id });

      const avatarName = `${Uuid.v4()}.jpg`; // проверить конкатенацию

      file.mv(`${config.get('staticPath')}/${avatarName}`);

      user.avatar = avatarName;

      await user.save();
      return res.json(user);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Ошибка загрузки аватара' });
    }
  }

  async deleteAvatar(req, res) {
    try {
      const user = await User.findOne({ _id: req.user.id });

      fs.unlinkSync(`${config.get('staticPath')}/${user.avatar}`);

      user.avatar = null;

      await user.save();
      return res.json(user);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Ошибка удаления аватара' });
    }
  }
}

module.exports = new FileController();
