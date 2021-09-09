import { api } from '@/api.json';

// * 查询中间仓库列表
export const getMiddlewareRepository = `${api}/middlewares/info`;
// * 查询中间件版本管理列表
export const getMiddlewareVersions = `${api}/middlewares/info/version`;
// * 安装中间件
export const installMiddleware = `${api}/clusters/{clusterId}/middlewares/install`;
// * 下架中间件
export const unInstallMiddleware = `${api}/clusters/{clusterId}/middlewares/delete`;
