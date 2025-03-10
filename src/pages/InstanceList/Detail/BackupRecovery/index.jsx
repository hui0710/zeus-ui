import React, { useEffect, useState } from 'react';
import { Tab } from '@alicloud/console-components';
import { Page, Content } from '@alicloud/console-components-page';
import { useLocation } from 'react-router';
import List from './list';
import Config from './config';
import DefaultPicture from '@/components/DefaultPicture';
const { Menu } = Page;
export default function BackupRecovery(props) {
	const location = useLocation();
	const { pathname } = location;
	const [selectedKey, setSelectedKey] = useState('list');
	const [customMid, setCustomMid] = useState(false);
	const [capabilities, setCapabilities] = useState([]);
	useEffect(() => {
		setCustomMid(props.customMid);
		setCapabilities(props.capabilities || []);
	}, [props]);
	const menuSelect = (selectedKey) => {
		setSelectedKey(selectedKey);
	};
	const childrenRender = (selected) => {
		if (selected === 'list') {
			return <List {...props} />;
		} else {
			return <Config {...props} />;
		}
	};
	const ConsoleMenu = () => {
		return (
			<Menu
				selectedKeys={selectedKey}
				onItemClick={menuSelect}
				style={{ height: '100%' }}
			>
				<Menu.Item key="list">备份列表</Menu.Item>
				<Menu.Item key="config">备份设置</Menu.Item>
			</Menu>
		);
	};
	if (customMid && !capabilities.includes('backup')) {
		return <DefaultPicture />;
	}
	if (pathname.includes('disasterBackup')) {
		return (
			<div>
				<Tab>
					<Tab.Item title="备份列表">
						<List {...props} />
					</Tab.Item>
					<Tab.Item title="备份设置">
						<Config {...props} />
					</Tab.Item>
				</Tab>
			</div>
		);
	} else {
		return (
			<Page>
				<Content menu={<ConsoleMenu />} style={{ margin: 0 }}>
					{childrenRender(selectedKey)}
				</Content>
			</Page>
		);
	}
}
