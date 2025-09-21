import { root } from "./root";

const userRoot = `${root}/user`;

const userData = {
  create : `${userRoot}/`,
  login  : `${userRoot}/login`,
  logout : `${userRoot}/logout`,
  update : `${userRoot}/:id`,
  getOne : `${userRoot}/:id`,
  getAll : `${userRoot}/`,
  validateToken : `${userRoot}/validateToken`,
  forgotPassword : `${userRoot}/forgot-password`,
  resetPassword : `${userRoot}/reset-password`
};

export interface CreateUserDto {
  name: string,
  last_name: string,
  email: string,
  password: string,
  user_type_id: number
}

export interface UpdateUserDto {
  name?: string,
  last_name?: string,
  email?: string,
  password?: string
}

export interface UserResponse {
  user_id: number,
  name: string,
  last_name: string,
  email: string,
  password: string,
  userType: string;
}

export interface UserNodeList {
    user: {
        user_id: number,
        name: string,
        last_name: string,
        email: string,
        password: string
    },
    userType: {
        user_type_id: number,
        name: string
    }
}

export interface ApiResponseUser {
  statusCode: number;
  message: string;
  data?: UserResponse;
  error?: string;
}

export interface ApiResponseUserList {
  statusCode: number;
  message: string;
  data: UserNodeList[];
}

export interface ApiResponseUserLogin {
  user: UserResponse;
  accessToken: string;
}

export interface ApiResponseGetOne {
  statusCode: number;
  message: string;
  data: UserNodeList;
}

export async function fetchCreateUser(data: CreateUserDto): Promise<ApiResponseUser> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(userData.create, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    const result = await response.json() as ApiResponseUser;

    if( !response.ok) {
      throw new Error(`Error creating user: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchCreateUser:", error);
    throw error;
  }
}


export async function fetchGetAllUsers(): Promise<ApiResponseUserList> {

  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(userData.getAll, {
      method: "GET",
      headers: headers,
    });

    const result = await response.json() as ApiResponseUserList;

    if (!response.ok) {
      throw new Error(`Error fetching users: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetAllUsers:", error);
    throw error;
  }
}


export async function fetchGetOne(userId: number): Promise<ApiResponseGetOne> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(userData.getOne.replace(":id", userId.toString()), {
      method: "GET",
      headers: headers,
    });

    const result = await response.json() as ApiResponseGetOne;

    if (!response.ok) {
      throw new Error(`Error fetching user: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetOne:", error);
    throw error;
  }
}


export async function fetchLoginUser(email: string, password: string) {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  const response = await fetch(userData.login, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ email, password }),
  });

  return response;
}


export async function fetchUpdateUser(userId:number, data: UpdateUserDto): Promise<ApiResponseUser> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(userData.update.replace(":id", userId.toString()), {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(data),
    });

    const result = await response.json() as ApiResponseUser;

    if (!response.ok) {
      throw new Error(`Error updating user: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchUpdateUser:", error);
    throw error;
  }
}

export async function fetchLogoutUser(accessToken: string): Promise<ApiResponseUser> {
  
  const token = localStorage.getItem("accessToken");
  
  const response = await fetch(userData.logout, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ accessToken }),
  });
  if (!response.ok) {
    throw new Error(`Error logging out user: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchValidateToken(accessToken: string): Promise<boolean> {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  const response = await fetch(userData.validateToken, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ accessToken }),
  });

  const result = await response.json() as boolean;

  if (!response.ok) {
    throw new Error(`Error validating token`);
  }

  return result;
}

export async function fetchForgotPassword(email: string) {
  try {
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const response = await fetch(userData.forgotPassword, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`Error sending forgot password request: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in fetchForgotPassword:", error);
    throw error;
  }
}

export async function fetchResetPassword(accessToken: string, newPassword: string) {
  try {

    console.log("Access Token:", accessToken);
    console.log("New Password:", newPassword);

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    });

    const response = await fetch(userData.resetPassword, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(
        { 
          accessToken, 
          newPassword 
        }
      ),
    });

    if (!response.ok) {
      throw new Error(`Error resetting password: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in resetPassword:", error);
    throw error;
  }
}