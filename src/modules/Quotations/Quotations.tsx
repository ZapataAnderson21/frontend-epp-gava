import { useNavigate } from "react-router-dom";
import { HeaderPanel, Panel } from "../../common/panel";
import { AddButton } from "../../common/button";
import QuotationTable from "./QuotationTable";
import { UsersRound as FaUserGroup } from "lucide-react";
import { Button } from "../../components";
import Permission from "../../common/auth/Permission";

export default function Quotations() {
  const navigate = useNavigate();

  return (
    <Panel>
      <HeaderPanel name="COTIZACIONES">
        <Permission permission="quotations.manage">
          <AddButton onClick={() => navigate("/admin/quotations/new")} />
        </Permission>
        <Button
          icon={<FaUserGroup />}
          label="Clientes"
          type="button"
          bgColor="#000000" 
          bgHoverColor="#333333"
          onClick={() => navigate("/admin/clients")}
        />
      </HeaderPanel>

      <QuotationTable />
    </Panel>
  );
}
