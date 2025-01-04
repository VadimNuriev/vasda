const fs = require('fs');
const config = require('config');

class FileService {
  createDir(file) {
    const path = this.getPath(file); 
    //создание директории хранения файла

    return new Promise(((resolve, reject) => {
      try {
        if (!fs.existsSync(path)) {
          
          fs.mkdirSync(path, { recursive: true }); //
          resolve({ message: 'Файл создан!' }); // создание файла в хранилище
        }
        reject(new Error('Файл уще существует!')); //проверка на наличие данного файла
      } catch (error) {
        reject(error.message);
      }
    }));
  }

  deleteFile(file) { //удаление файла
    const path = this.getPath(file);
    if (file.type === 'dir') {
      fs.rmdirSync(path);
    } else {
      fs.unlinkSync(path);
    }
  }

  getPath(file) {
    return `${config.get('filePath')}/${file.user}/${file.path}`; // Метод возвращает путь от корня хранилища к зарегистрированному файлу
  }
}

module.exports = new FileService();
//Импорт кода