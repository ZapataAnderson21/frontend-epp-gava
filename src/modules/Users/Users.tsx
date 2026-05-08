import { Panel, HeaderPanel } from "../../common/panel";
import UserTable from "./UserTable";
import { useNavigate } from "react-router-dom";
import AddButton from "../../common/button/AddButton";
import { useCurrentUser } from "../../hooks";
import Permission from "../../common/auth/Permission";
import { adminTypes } from "../../utils";
import { useState } from "react";

export default function Users() {

  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");

  const navigate = useNavigate();
  const tabBaseClass = "px-4 py-2 text-sm font-semibold border-b-2 transition-colors";
  const tabClass = (tab: "active" | "inactive") =>
    `${tabBaseClass} ${
      activeTab === tab
        ? "border-blue-600 text-blue-700"
        : "border-transparent text-gray-500 hover:text-blue-700"
    }`;

  return (
    <Panel>
      <HeaderPanel name={`USUARIOS`}>
        <Permission user={user} allow={adminTypes}>
          <AddButton onClick={() => navigate("/admin/users/new")} />
        </Permission>
      </HeaderPanel>

      <div className="mb-5 flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          className={tabClass("active")}
          onClick={() => setActiveTab("active")}
        >
          Usuarios activos
        </button>
        <button
          type="button"
          className={tabClass("inactive")}
          onClick={() => setActiveTab("inactive")}
        >
          Usuarios inactivos
        </button>
      </div>

      <UserTable showInactive={activeTab === "inactive"} />

    </Panel>
  );
}
