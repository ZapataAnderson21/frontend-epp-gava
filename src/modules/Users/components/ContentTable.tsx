import RowTable from "./RowTable";
import { fetchGetAllUsers, type ApiResponseUserList, type UserNodeList} from "../../../data/userData";
import { useEffect, useState } from "react";

export default function ContentTable() {
  const [users, setUsers] = useState<UserNodeList[]>([]);

  useEffect(() => {
    const getUsers = async () => {
      const response = await fetchGetAllUsers() as ApiResponseUserList;

      const result = response.data as UserNodeList[];

      if (!response || !result || result.length === 0) {
        console.error("Failed to fetch users or no data returned");
        return;
      }

      setUsers(result);
    };

    getUsers();
  }, []);

  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[13px] md:text-[14px]">
      {users.map(user => (
        <RowTable key={user.user.user_id} id={user.user.user_id} name={user.user.name} lastname={user.user.last_name} email={user.user.email} rol={user.userType.name} />
      ))}
    </div>
  );
}
