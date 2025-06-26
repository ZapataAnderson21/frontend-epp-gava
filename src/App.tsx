import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './Login.tsx';

import Requests from './modules/Requests/Requests.tsx';
import Users from './modules/Users/Users.tsx';
import User from './modules/Users/User.tsx';
import Home from './sections/Home.tsx';
import NewUser from './modules/Users/NewUser.tsx';
import NewRequest from './modules/Requests/NewRequest.tsx';
import NewProject from './modules/Projects/NewProject.tsx';
import Projects from './modules/Projects/Projects.tsx';
import NewElement from './modules/Elements/NewElement.tsx';
import Elements from './modules/Elements/Elements.tsx';
import NewRole from './modules/Users/NewRole.tsx';
import Project from './modules/Projects/Project.tsx';
import ResetPassword from './ResetPassword.tsx';

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/admin' element={<Home />} >
          <Route path='' element={<Projects />} />
          <Route path='projects' element={<Projects />} />
          <Route path='projects/:id' element={<Project />} />
          <Route path='projects/new' element={<NewProject />} />
          <Route path='requests' element={<Requests />} />
          <Route path='requests/new' element={<NewRequest />} />
          <Route path='elements' element={<Elements />} />
          <Route path='elements/new' element={<NewElement />} />
          <Route path='users' element={<Users />} />
          <Route path='users/:id' element={<User />} />
          <Route path='users/new' element={<NewUser />} />
          <Route path='users/role/new' element={<NewRole />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

