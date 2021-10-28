import { api } from '@/api.json';

export const clusters = `${api}/clusters`;
export const cluster = `${api}/clusters/{clusterId}`;
export const namespaces = `${api}/clusters/{clusterId}/namespaces`;
// 资源池组件部署
export const components = `${api}/clusters/{clusterId}/components/{componentName}`;
