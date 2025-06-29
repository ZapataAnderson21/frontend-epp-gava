import type { ElementType } from './elementData'
import { root } from './root'

const elementRequestRoot = `${root}/element-request`

const elementRequestData = {
  create: `${elementRequestRoot}/`,
  getAll: `${elementRequestRoot}/`,
  getByRequest: `${elementRequestRoot}/request/:request_id`,
  update: `${elementRequestRoot}/:id`,
  delete: `${elementRequestRoot}/:id`,
}

export interface ElementRequestType {
  element_request_id: number
  quantity_requested: number
  unit: string
  element_id: number
  request_id: number
  element?: ElementType
}

export interface CreateElementRequestDto {
  quantity_requested: number
  unit: string
  element_id: number
  request_id: number
}

export interface UpdateElementRequestDto {
  element_request_id?: number
  quantity_requested: number
  unit: string
  element_id: number
  request_id: number
}

export interface ElementRequestGetAllResponse {
  statusCode: number
  message: string
  data: ElementRequestType[]
}

export interface ElementRequestResponse {
  statusCode: number
  message: string
  data: ElementRequestType
}

export async function fetchCreateElementRequest(data: CreateElementRequestDto): Promise<ElementRequestResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestData.create, {
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

export async function fetchGetAllElementRequests(): Promise<ElementRequestGetAllResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestData.getAll, {
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

export async function fetchGetElementRequestsByRequest(request_id: number): Promise<ElementRequestGetAllResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestData.getByRequest.replace(':request_id', String(request_id)), {
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

export async function fetchUpdateElementRequest(id: number, data: UpdateElementRequestDto): Promise<ElementRequestResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestData.update.replace(':id', String(id)), {
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

export async function fetchDeleteElementRequest(id: number): Promise<ElementRequestResponse> {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(elementRequestData.delete.replace(':id', String(id)), {
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