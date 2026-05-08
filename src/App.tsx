import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Home from './sections/Home.tsx';
import Dashboard from './modules/Dashboard/Dashboard.tsx';

import { Login, ResetPassword } from './modules/Login';
import { Users, User, NewUser} from './modules/Users';
import { Elements, Element, NewElement } from './modules/Elements';
import { Projects, Project, NewProject, EditProject } from './modules/Projects';
import { ProjectGantt } from './modules/Projects/routes/Project/outlet/ProjectGantt';
import { Requests, Request, NewRequest } from './modules/Requests';
import PurchaseOrder from './modules/Projects/routes/Project/outlet/PurchaseOrders/PurchaseOrder.tsx';
import NewPurchaseOrder from './modules/Projects/routes/Project/outlet/PurchaseOrders/NewPurchaseOrder.tsx';
import { Emergencies, Emergency, NewEmergency } from './modules/Emergencies';
import { Resources, Resource, NewResource } from './modules/Resources';
import { Suppliers, Supplier, NewSupplier } from './modules/Suppliers';
import { Quotations, Quotation, NewQuotation, EditQuotation } from './modules/Quotations';
import { Clients, Client, NewClient } from './modules/Clients';
import { PettyCashes } from './modules/Projects/routes/Project/outlet/PettyCashes/index.ts';
import PurchaseOrdersProject from './modules/Projects/routes/Project/outlet/PurchaseOrders';
import RequireAuth from './RequireAuth.tsx';
import Workers from './modules/Workers/Workers.tsx';
import EditPurchaseOrder from './modules/Projects/routes/Project/outlet/PurchaseOrders/EditPurchaseOrder';
import RequestDraft from './modules/Requests/RequestDraft.tsx';
import Payrolls from './Payrolls/Payrolls.tsx';
import Attendances from './Payrolls/Attendances.tsx';
import WeeklyPayroll from './Payrolls/WeeklyPayroll.tsx';
import { GeneralPayrolls, GeneralWeeklyPayroll } from './modules/Payrolls';
import Summary from './modules/Projects/routes/Project/outlet/Summary/Summary.tsx';
import RequestsProject from './modules/Projects/routes/Project/outlet/Requests.tsx';
import EmergenciesProject from './modules/Projects/routes/Project/outlet/Emergencies.tsx';
import ProjectInventory from './modules/Projects/routes/Project/outlet/Inventory.tsx';
import { WorkerMonthlyEvaluations } from './modules/WorkerMonthlyEvaluations';

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/admin' element={<RequireAuth><Home /></RequireAuth>}>
          <Route path='' element={<Dashboard />} />
          <Route path='dashboard' element={<Dashboard />} />
          {/* Projects routes */}
          <Route path='projects' element={<Projects />} />
          <Route path='projects/new' element={<NewProject />} />
          <Route path='projects/edit/:id' element={<EditProject />} />
          <Route path='projects/:id' element={<Project />}>
            <Route path="" element={<Summary />} />
            <Route path='purchase-orders'>
              <Route index element={<PurchaseOrdersProject />} />
              <Route path=':purchaseOrderId' element={<PurchaseOrder />} />
              <Route path='new' element={<NewPurchaseOrder />} />
              <Route path='edit/:purchaseOrderId' element={<EditPurchaseOrder />} />
            </Route>
            <Route path='progress' element={<ProjectGantt />} />
            <Route path='payrolls' element={<Payrolls />} />
            <Route path='petty-cash' element={<PettyCashes />} />
            <Route path='requests' element={<RequestsProject />} />
            <Route path='inventory' element={<ProjectInventory />} />
            <Route path='payrolls/attendances' element={<Attendances />} />
            <Route path='payrolls/weekly' element={<WeeklyPayroll  />} />
            <Route path='emergencies' element={<EmergenciesProject  />} />
          </Route>
          {/* End projects routes */}
          {/* Inventory routes */}
          <Route path='inventory' element={<Elements />} />
          <Route path='inventory/:family' element={<Elements />} />
          {/* End inventory routes */}
          {/* Requests routes */}
          <Route path='requests' element={<Requests />} />
          <Route path='requests/:id' element={<Request />} />
          <Route path='requests/new' element={<NewRequest />} />
          <Route path='requests/edit/:id' element={<RequestDraft />} />
          {/* End requests routes */}
          {/* Elements routes */}
          <Route path='elements' element={<Elements />} />
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
          {/* Quotations routes */}
          <Route path='quotations' element={<Quotations />} />
          <Route path='quotations/new' element={<NewQuotation />} />
          <Route path='quotations/edit/:id' element={<EditQuotation />} />
          <Route path='quotations/:id' element={<Quotation />} />
          {/* End quotations routes */}
          {/* Clients routes */}
          <Route path='clients' element={<Clients />} />
          <Route path='clients/new' element={<NewClient />} />
          <Route path='clients/:id' element={<Client />} />
          {/* End clients routes */}
          {/* Workers routes */}
          <Route path='workers' element={<Workers />} />
          <Route path='worker-monthly-evaluations' element={<WorkerMonthlyEvaluations />} />
          {/* End workers routes */}
          {/* General Payrolls routes */}
          <Route path='payrolls' element={<GeneralPayrolls />} />
          <Route path='payrolls/:weekId' element={<GeneralWeeklyPayroll />} />
          {/* End general payrolls routes */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

