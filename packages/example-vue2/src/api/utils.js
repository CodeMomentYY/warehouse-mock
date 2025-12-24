import axios from 'axios';
import config from '@/const/config';

// 创建 axios 实例
const Ax = axios.create({
  timeout: 15000,
  headers: { 'content-type': 'application/json' },
});

// 响应拦截器
Ax.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 0 && data.success !== true) {
      console.error('[API Error]', data.msg || data.info);
      throw new Error(data.msg || data.info || 'API Error');
    }
    return data;
  },
  (error) => {
    console.error('[Network Error]', error.message);
    throw error;
  }
);

/**
 * 创建 RPC 风格的 POST 请求
 * @param {string} action - 接口名称，如 'user.account.getInfo'
 * @param {object} options - 配置选项
 */
export const easyPost = (action, { api = config.API } = {}) => {
  return async (data = {}) => {
    console.log(`[API] 请求: ${api}?${action}`, data);
    
    const response = await Ax.post(
      `${api}?${action}`,
      {
        action,
        ...data,
      }
    );
    
    return response;
  };
};

/**
 * 导出具体的 API 方法
 */

// 用户相关
export const getUserInfo = easyPost('user.account.getInfo');
export const getUserProfile = easyPost('user.account.profile');

// 积分相关 (模拟 user.taurus.pointInfo)
export const getPointInfo = easyPost('user.taurus.pointInfo');

// 会员相关
export const getMemberInfo = easyPost('member.info.get');

export default {
  getUserInfo,
  getUserProfile,
  getPointInfo,
  getMemberInfo,
};

