import Axios from './request.js';
import * as USER from './user.constants';
import {
	usersProps,
	deleteProps,
	userProps,
	rolesProps,
	updateProps
} from '@/pages/UserManage/user';

export const postLogin = (params: any) => {
	return Axios.post(USER.loginApi, params);
};

export const postLogout = (params: any) => {
	return Axios.post(USER.logoutApi, params);
};

export const getUserInfo = (params: any) => {
	return Axios.get(USER.userInfoApi, params);
};
// * 根据用户权限获取菜单
export const getMenu = () => {
	return Axios.get(USER.getMenus);
};

export const getLicense = () => {
	return Axios.get(USER.license);
};

export const putLicense = (params: any) => {
	return Axios.put(USER.license, params);
};
// * 获取rsa公钥
export const getRsaKey = () => {
	return Axios.get(USER.getRsaKey);
};
// * 获取用户列表
export const getUserList: (params: {
	keyword: string;
}) => Promise<usersProps> = (params: { keyword: string }) => {
	return Axios.get(USER.getUserList, params);
};
// * 删除用户
export const deleteUser: (params: {
	userName: string;
}) => Promise<deleteProps> = (params: { userName: string }) => {
	return Axios.delete(USER.updateUser, params);
};
// * 编辑用户
export const updateUser: (params: userProps) => Promise<updateProps> = (
	params: userProps
) => {
	return Axios.json(USER.updateUser, params, {}, 'PUT');
};
// * 重置密码
export const resetPassword: (params: {
	userName: string;
}) => Promise<deleteProps> = (params: { userName: string }) => {
	return Axios.post(USER.resetPassword, params);
};
// * 获取角色列表
export const getRoles: () => Promise<rolesProps> = () => {
	return Axios.get(USER.getRoles);
};
// * 创建用户
export const createUser: (params: userProps) => Promise<updateProps> = (
	params: userProps
) => {
	return Axios.json(USER.createUser, params, {}, 'POST');
};
// * 获取用户信息
export const getUserInformation: () => Promise<usersProps> = () => {
	return Axios.get(USER.createUser);
};
// * 修改用户密码
export const updatePassword = (params: any) => {
	return Axios.put(USER.updatePassword, params);
};
