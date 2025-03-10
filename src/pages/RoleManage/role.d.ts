import { resProps } from '@/types/comment';
export interface roleProps {
	description?: string;
	id: number;
	roleId: number;
	name?: string;
	createTime: string | null | undefined;
	menu: any[] | undefined;
	[propsName: string]: any;
}
export interface roleTree {
	id: number;
	parentId: number;
	own: boolean;
	aliasName: string;
}
export interface rolesProps extends resProps {
	data: roleProps[];
}
export interface updateProps extends resProps {
	data: roleProps;
}
export interface deleteProps extends resProps {
	data: boolean;
}
