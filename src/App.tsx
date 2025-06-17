import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './Login.tsx';

import Request from './modules/Requests/Request.tsx';
import Users from './modules/Users/User.tsx';
import Home from './sections/Home.tsx';
import Epp from './modules/Epps/Epp.tsx';
import NewEpp from './modules/Epps/NewEpp.tsx'
import NewUser from './modules/Users/NewUser.tsx';
import NewRequest from './modules/Requests/NewRequest.tsx';

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/admin' element={<Home />} >
          <Route path='' element={<Request />} />
          <Route path='requests' element={<Request />} />
          <Route path='requests/new' element={<NewRequest />} />
          <Route path='epps' element={<Epp />} />
          <Route path='epps/new' element={<NewEpp />} />
          <Route path='users' element={<Users />} />
          <Route path='users/new' element={<NewUser />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

