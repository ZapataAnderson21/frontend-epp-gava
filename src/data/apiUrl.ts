import { config } from "../config/env";

export const root = config.apiUrl;

export const userTypeApi = `${root}user-type/`;

export const userApi = `${root}user/`;

export const projectApi = `${root}project/`;

export const elementApi = `${root}element/`;

export const requestApi = `${root}request/`;

export const elementRequestApi = `${root}element-request/`;

export const requestResponseApi = `${root}request-response/`;

export const elementRequestResponseApi = `${root}element-request-response/`;

export const emergencyApi = `${root}emergency/`;

export const resourceApi = `${root}resource/`;

export const categoryResourceApi = `${root}category-resource/`;

export const supplierApi = `${root}supplier/`;

export const clientApi = `${root}client/`;

export const purchaseOrderApi = `${root}purchase-order/`;

export const purchaseOrderConditionApi = `${root}purchase-order-condition/`;

export const quotationApi = `${root}quotation/`;

export const resourcePurchaseOrderApi = `${root}resource-purchase-order/`;

export const pettyCashApi = `${root}petty-cash/`;

export const serviceSaleApi = `${root}service-sale/`;

export const workerApi = `${root}worker/`;

export const requestWorkerApi = `${root}request-worker/`;

export const elementRequestWorkerPlanApi = `${root}element-request-worker-plan/`;

export const attendanceApi = `${root}attendance/`;

export const weekApi = `${root}week/`;

export const dailyWageApi = `${root}daily-wage/`;

export const weeklyWageApi = `${root}weekly-wage/`;

export const taskApi = `${root}task/`;

export const notificationApi = `${root}notification/`;

export const inventoryApi = `${root}inventory/`;

export const expiringDocumentsApi = `${root}expiring-documents/`;

export const workerMonthlyEvaluationApi = `${root}worker-monthly-evaluation/`;

export const workerMonthlyEvaluationTemplateApi = `${workerMonthlyEvaluationApi}template/`;

export const workerMonthlyEvaluationInstanceApi = `${workerMonthlyEvaluationApi}instance/`;

export const workerMonthlyEvaluationPeriodApi = `${workerMonthlyEvaluationApi}period/`;
