import axios from 'axios';

const BASE_URL = '/api/mock';

axios.defaults.baseURL = '/';

export interface MockItem {
  name: string;           // 接口名
  delay: number;          // 接口延时
  enabled: boolean;       // 是否启用
  activeScene: string;    // 当前激活场景
  scenes: string[];       // 场景列表
  updatedAt: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// 获取 Mock 列表
export async function getMockList(): Promise<MockItem[]> {
  const res = await axios.get<ApiResponse<MockItem[]>>(`${BASE_URL}/list`);
  if (!res.data.success) {
    throw new Error(res.data.message || '获取列表失败');
  }
  return res.data.data || [];
}

// === 接口管理 ===

// 创建接口
export async function createInterface(name: string, delay: number = 0, enabled: boolean = true): Promise<void> {
  const res = await axios.post<ApiResponse>(`${BASE_URL}/interface/create`, {
    name,
    delay,
    enabled
  });
  if (!res.data.success) {
    throw new Error(res.data.message || '创建接口失败');
  }
}

// 获取接口配置
export async function getInterfaceConfig(apiName: string): Promise<any> {
  const res = await axios.get<ApiResponse>(`${BASE_URL}/interface/config/${apiName}`);
  if (!res.data.success) {
    throw new Error(res.data.message || '获取接口配置失败');
  }
  return res.data.data;
}

// 更新接口配置
export async function updateInterface(oldName: string, newName: string, delay: number, enabled: boolean): Promise<void> {
  const res = await axios.put<ApiResponse>(`${BASE_URL}/interface/update`, {
    oldName,
    newName,
    delay,
    enabled
  });
  if (!res.data.success) {
    throw new Error(res.data.message || '更新接口配置失败');
  }
}

// 删除接口
export async function deleteInterface(apiName: string): Promise<void> {
  const res = await axios.delete<ApiResponse>(`${BASE_URL}/interface/delete/${apiName}`);
  if (!res.data.success) {
    throw new Error(res.data.message || '删除接口失败');
  }
}

// === 场景管理 ===

// 创建场景
export async function createScene(apiName: string, sceneName: string, data?: any): Promise<void> {
  const res = await axios.post<ApiResponse>(`${BASE_URL}/scene/create`, {
    apiName,
    sceneName,
    data
  });
  if (!res.data.success) {
    throw new Error(res.data.message || '创建场景失败');
  }
}

// 获取场景详情
export async function getSceneDetail(apiName: string, sceneName: string): Promise<{ apiName: string; sceneName: string; content: string }> {
  const res = await axios.get<ApiResponse>(`${BASE_URL}/scene/detail/${apiName}/${sceneName}`);
  if (!res.data.success) {
    throw new Error(res.data.message || '获取场景详情失败');
  }
  return res.data.data;
}

// 更新场景数据
export async function updateScene(apiName: string, oldSceneName: string, newSceneName: string, data: string): Promise<void> {
  const res = await axios.put<ApiResponse>(`${BASE_URL}/scene/update`, {
    apiName,
    oldSceneName,
    newSceneName,
    data
  });
  if (!res.data.success) {
    throw new Error(res.data.message || '更新场景数据失败');
  }
}

// 删除场景
export async function deleteScene(apiName: string, sceneName: string): Promise<void> {
  const res = await axios.delete<ApiResponse>(`${BASE_URL}/scene/delete/${apiName}/${sceneName}`);
  if (!res.data.success) {
    throw new Error(res.data.message || '删除场景失败');
  }
}

// 激活场景
export async function activateScene(apiName: string, sceneName: string): Promise<void> {
  const res = await axios.post<ApiResponse>(`${BASE_URL}/scene/activate`, {
    apiName,
    sceneName
  });
  if (!res.data.success) {
    throw new Error(res.data.message || '激活场景失败');
  }
}
