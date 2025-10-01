import RowTable from "./RowTable";
import LoadingSkeletonTable from "../../../common/LoadingSkeletonTable";
import HeaderTable from "./HeaderTable";
import ErrorMessage from "../../../common/ErrorMessage";
import { useFetch } from "../../../hooks/useFetch";
import { userApi } from "../../../data/apiUrl";
import type { User } from "../../../data/types";

export default function ContentTable() {

  const { data: users, loading, error } = useFetch<User[]>(userApi, []);

  if (loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!users) {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-start gap-2 overflow-auto w-full text-gray-600">
      <div className="flex flex-col items-center justify-between min-w-full">
        <HeaderTable />
        {users.map((user, index) => (
          <RowTable
            key={user.user_id}
            order={index + 1}
            id={user.user_id}
            name={user.name}
            lastname={user.last_name}
            email={user.email}
            rol={user.userType}
          />
        ))}
      </div>
    </div>
  );
}
