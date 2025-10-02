import RequestDraft from "./RequestDraft";
import RequestView from "./RequestView";
import { useParams } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import type { RequestType } from "../../data/types";
import { requestApi } from "../../data/apiUrl";
import LoadingSkeletonForm from "../../common/loading/LoadingSkeletonForm";
import ErrorMessage from "../../common/error/ErrorMessage";

export default function Request() {
  const { id: request_id } = useParams<{ id: string }>();

  const { data: request, loading, error } = useFetch<RequestType>(`${requestApi}${request_id}`);

  if (loading) {
    return <LoadingSkeletonForm numberRows={4} />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!request) {
    return <ErrorMessage errorMessage="No se encontró el requerimiento." />;
  }

  return (
    <>
      {request.status === "draft" ? (
        <RequestDraft request_id={Number(request_id)} />
      ) : (
        <RequestView request_id={Number(request_id)} />
      )}
    </>
  );
}
