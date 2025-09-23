import RowTable from "./RowTable";
import { fetchGetAllUsers } from "../../../data/userData";
import { useEffect, useState } from "react";
import LoadingSkeletonTable from "../../../common/LoadingSkeletonTable";
import type { User } from "../../../data/userData";
import HeaderTable from "./HeaderTable";

export default function ContentTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  let count = 0;

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);

      const response = await fetchGetAllUsers();
      const responseData = await response.json();

      setLoading(false);
      console.log(responseData);

      if (responseData.statusCode === 200) {
        setUsers(responseData.data);
      } else {
        setError(responseData.message);
      }

      setLoading(false);
    };

    getUsers();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <LoadingSkeletonTable />
      </div>
    );
  }

  if (error) {
    return(
      <div className="flex items-center justify-center w-full h-full">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between min-w-full">
      <HeaderTable />
      {users.map(user => {
        count = count + 1;
        return (
          <RowTable key={user.user_id} order={count} id={user.user_id} name={user.name} lastname={user.last_name} email={user.email} rol={user.userType} />
        );
      })}
    </div>
  );
}
