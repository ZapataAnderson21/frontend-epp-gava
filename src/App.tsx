import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Home from './sections/Home.tsx';

import { Login, ResetPassword } from './modules/Login';
import { Users, User, NewUser} from './modules/Users';
import { Elements, Element, NewElement } from './modules/Elements';
import { Projects, Project, NewProject, EditProject } from './modules/Projects';
import { Requests, Request, NewRequest } from './modules/Requests';
import { PurchaseOrders, PurchaseOrder, NewPurchaseOrder } from './modules/Projects/PurchaseOrders';
import { Emergencies, Emergency, NewEmergency } from './modules/Emergencies';
import { Resources, Resource, NewResource } from './modules/Resources';
import { Suppliers, Supplier, NewSupplier } from './modules/Suppliers';
import PettyCashes from './modules/Projects/PettyCashes/PettyCashes.tsx';
import ServiceSales from './modules/Projects/ServiceSales/ServiceSales.tsx';
import RequireAuth from './RequireAuth.tsx';
import Workers from './modules/Workers/Workers.tsx';
import EditPurchaseOrder from './modules/Projects/PurchaseOrders/EditPurchaseOrder.tsx';

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/admin' element={<RequireAuth><Home /></RequireAuth>}>
          <Route path='' element={<Projects />} />
          {/* Projects routes */}
          <Route path='projects' element={<Projects />} />
          <Route path='projects/:id' element={<Project />} />
          <Route path='projects/edit/:id' element={<EditProject />} />
          <Route path='projects/new' element={<NewProject />} />
          {/* End projects routes */}
          {/* Requests routes */}
          <Route path='requests' element={<Requests />} />
          <Route path='requests/:id' element={<Request />} />
          <Route path='requests/new' element={<NewRequest />} />
          {/* End requests routes */}
          {/* Elements routes */}
          <Route path='elements/type/:type' element={<Elements />} />
          <Route path='elements/:id' element={<Element />} />
          <Route path='elements/new' element={<NewElement />} />
          {/* End elements routes */}
          {/* Users routes */}
          <Route path='users' element={<Users />} />
          <Route path='users/:id' element={<User />} />
          <Route path='users/new' element={<NewUser />} />
          {/* End users routes */}
          {/* Emergencies routes */}
          <Route path='emergencies' element={<Emergencies />} />
          <Route path='emergencies/:id' element={<Emergency />} />
          <Route path='emergencies/new' element={<NewEmergency />} />
          {/* End emergencies routes */}
          {/* Resources routes */}
          <Route path='resources/new' element={<NewResource />} />
          <Route path='resources/:id' element={<Resource />} />
          <Route path='resources' element={<Resources />} />
          {/* End resources routes */}
          {/* Suppliers routes */}
          <Route path='suppliers' element={<Suppliers />} />
          <Route path='suppliers/new' element={<NewSupplier />} />
          <Route path='suppliers/:id' element={<Supplier />} />
          {/* End suppliers routes */}
          {/* PurchaseOrders routes */}
          <Route path='purchase-orders' element={<PurchaseOrders />} />
          <Route path='purchase-orders/:id' element={<PurchaseOrder />} />
          <Route path='purchase-orders/new' element={<NewPurchaseOrder />} />
          <Route path='purchase-orders/edit/:id' element={<EditPurchaseOrder />} />
          {/* End purchaseOrders routes */}
          {/* PettyCash routes */}
          <Route path='petty-cash' element={<PettyCashes />} />
          {/* End pettyCash routes */}
          {/* ServiceSales routes */}
          <Route path='service-sale' element={<ServiceSales />} />
          {/* End serviceSales routes */}
          {/* Workers routes */}
          <Route path='workers' element={<Workers />} />
          {/* End workers routes */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

