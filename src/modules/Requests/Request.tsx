import RequestDraft from "./RequestDraft";
import RequestView from "./RequestView";
import { fetchGetRequestById, type RequestType } from "../../data/requestData";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Request() {

  const { id: request_id } = useParams<{ id: string }>();

  const [request, setRequest] = useState<RequestType>();

  useEffect(() => {
    if (request_id) {
      fetchGetRequestById(Number(request_id)).then((response) => {
        setRequest(response.data);
      });
    }
  }, [request_id]);

  return (
    <>
      {
        request?.status === "draft" ? (
          <RequestDraft request_id={Number(request_id)} />
        ) : (
          <RequestView request_id={Number(request_id)} />
        )
      }
    </>
  );
}
