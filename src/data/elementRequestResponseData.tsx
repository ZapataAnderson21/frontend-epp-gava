import type { ElementRequestType } from './elementRequestData'
import type { RequestResponseType } from './requestResponseData'
import { root } from './root'

const elementRequestResponseRoot = `${root}/element-request-response`

const elementRequestResponseData = {
  create: `${elementRequestResponseRoot}/`,
  getAll: `${elementRequestResponseRoot}/`,
  getByRequest: `${elementRequestResponseRoot}/request/:request_id`,
  update: `${elementRequestResponseRoot}/:id`,
  delete: `${elementRequestResponseRoot}/:id`,
}

export interface ElementRequestResponseType {
  element_request_response_id: number
  element_request_id: number
  quantity_accepted: number
  request_response_id: number
  elementRequest?: ElementRequestType
  requestResponse?: RequestResponseType
}

export interface CreateElementRequestResponseDto {
  element_request_id: number
  quantity_accepted: number
  request_response_id: number
}

export interface UpdateElementRequestResponseDto {
  element_request_id?: number
  quantity_accepted: number
  request_response_id: number
}

export interface ElementRequestResponseResponse {
  statusCode: number
  message: string
  data: ElementRequestResponseType
}

export interface ElementRequestResponseGetAllResponse {
  statusCode: number
  message: string
  data: ElementRequestResponseType[]
}

export async function fetchCreateElementRequestResponse(data: CreateElementRequestResponseDto): Promise<ElementRequestResponseResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestResponseData.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return await response.json()
  } catch (error) {
    throw new Error(`Error creating element request: ${error}`)
  }
}

export async function fetchGetAllElementRequestResponses(): Promise<ElementRequestResponseGetAllResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestResponseData.getAll, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return await response.json()
  } catch (error) {
    throw new Error(`Error fetching all element requests: ${error}`)
  }
}

export async function fetchGetElementRequestResponsesByRequest(request_id: number): Promise<ElementRequestResponseGetAllResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestResponseData.getByRequest.replace(':request_id', String(request_id)), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return await response.json()
  } catch (error) {
    throw new Error(`Error fetching element requests by request ID: ${error}`)
  }
}

export async function fetchUpdateElementRequestResponse(id: number, data: UpdateElementRequestResponseDto): Promise<ElementRequestResponseResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestResponseData.update.replace(':id', String(id)), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return await response.json()
  } catch (error) {
    throw new Error(`Error updating element request: ${error}`)
  }
}

export async function fetchDeleteElementRequestResponse(id: number): Promise<ElementRequestResponseResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestResponseData.delete.replace(':id', String(id)), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return await response.json()
  } catch (error) {
    throw new Error(`Error deleting element request: ${error}`)
  }
}