import React from 'react';
import { Link } from 'react-router-dom';
import './plug.css'

function Plug() {
  return (
    <div className='plugContainer'>
      <div className="plug">
        Чтобы попасть в сервис облачного хранилища SkyCloud, пожалуйста, <Link to='/login'>авторизуйтесь</Link><br/>
        А также вы можете сыграть в <Link to='/tetris'>тетрис</Link>
      </div>
    </div>
  );
}

export default Plug;
