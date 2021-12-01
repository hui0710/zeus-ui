import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { Message, Button, Dialog } from '@alicloud/console-components';
import Actions, { LinkButton } from '@alicloud/console-components-actions';
import { StoreState, globalVarProps } from '@/types/index';
import { Page, Content, Header } from '@alicloud/console-components-page';
import { upgradeChart } from '@/services/serviceList';
import { getVersions } from '@/services/serviceList';
import messageConfig from '@/components/messageConfig';
import { useHistory } from 'react-router';
import { middlewareProps } from './service.list';
import Table from '@/components/MidTable';
import { iconTypeRender } from '@/utils/utils';
import UploadMiddlewareForm from '../ServiceCatalog/components/UploadMiddlewareForm';
// import './index.scss';

interface versionProps {
	globalVar: globalVarProps;
}
interface paramsProps {
	type: string;
}
enum versionStatus {
	now = '当前版本',
	future = '可安装升级版本',
	history = '历史版本',
	updating = 'operator升级中',
	needUpgradeOperator = '需要升级operator',
	canUpgrade = '升级版本'
}
function ServiceVersion(props: versionProps): JSX.Element {
	const {
		globalVar: { cluster, namespace }
	} = props;
	const params: paramsProps = useParams();
	const [originData, setOriginData] = useState<middlewareProps[]>([]);
	const [dataSource, setDataSource] = useState<middlewareProps[]>([]);
	const [visible, setVisible] = useState<boolean>(false);
	const url = window.location.href.split('/');
	const history = useHistory();
	const [installNum, setInstallNum] = useState<number>();
	const getData = () => {
		getVersions({
			clusterId: cluster.id,
			middlewareName: url[url.length - 1],
			namespace: namespace.name,
			type: url[url.length - 2]
		}).then((res) => {
			if (res.success) {
				setOriginData(res.data);
				setDataSource(res.data);
			} else {
				Message.show(messageConfig('error', '失败', res));
			}
		});
	};
	useEffect(() => {
		getData();
	}, []);
	const onCreate = () => {
		getData();
	};
	const onFilter = (filterParams: any) => {
		const keys = Object.keys(filterParams);
		if (filterParams[keys[0]].selectedKeys.length > 0) {
			const list = originData.filter(
				(item) =>
					item[keys[0]] === filterParams[keys[0]].selectedKeys[0]
			);
			setDataSource(list);
		} else {
			setDataSource(originData);
		}
	};
	const onSort = (dataIndex: string, order: string) => {
		if (dataIndex === 'createTime') {
			const dsTemp = originData.sort((a, b) => {
				const result =
					moment(a[dataIndex]).unix() - moment(b[dataIndex]).unix();
				return order === 'asc'
					? result > 0
						? 1
						: -1
					: result > 0
					? -1
					: 1;
			});
			setDataSource([...dsTemp]);
		}
	};
	const versionStatusRender = (
		value: string,
		index: number,
		record: middlewareProps
	) => {
		const color =
			value === 'now'
				? '#00A7FA'
				: value === ('future' || 'updating')
				? '#52C41A'
				: '#666666';
		const bgColor =
			value === 'now'
				? '#EBF8FF'
				: value === ('future' || 'updating')
				? '#F6FFED'
				: '#F5F5F5';
		return (
			<div
				className="version-status-display"
				style={{
					color: color,
					backgroundColor: bgColor,
					borderColor: color
				}}
			>
				{versionStatus[value]}
			</div>
		);
	};
	const actionRender = (
		value: string,
		index: number,
		record: middlewareProps
	) => {
		return (
			<Actions>
				{record.versionStatus === 'future' ||
					record.versionStatus === 'needUpgradeOperator' ||
					record.versionStatus === 'canUpgrade' ||
					(record.versionStatus === 'updating' && (
						<LinkButton
							style={{
								color:
									record.versionStatus !== 'future'
										? '#3DBCFB'
										: '#cccccc'
							}}
							onClick={() => installUpdate(record)}
						>
							升级{installNum ? '中(' + installNum + 's)' : ''}
						</LinkButton>
					))}
			</Actions>
		);
	};
	const installUpdate = (record: middlewareProps) => {
		if (record.versionStatus === 'needUpgradeOperator') {
			const dialog = Dialog.show({
				title: '操作确认',
				content:
					'经系统检测，该版本的中间件还未安装，请到中间件市场进行升级安装',
				footer: (
					<>
						<Button type="primary" onClick={() => dialog.hide()}>
							我知道了
						</Button>
						<Button
							onClick={() =>
								history.push(
									`middlewareRepository/versionManagement/${
										url[url.length - 2]
									}`
								)
							}
						>
							现在去升级
						</Button>
					</>
				)
			});
		} else if (record.versionStatus) {
			Dialog.show({
				title: '操作确认',
				content: '是否确认升级到该版本？',
				onOk: () => {
					return upgradeChart({
						clusterId: cluster.id,
						namespace: namespace.name,
						middlewareName: url[url.length - 1],
						type: url[url.length - 2],
						chartName: record.chartName,
						upgradeChartVersion: record.chartVersion
					}).then((res) => {
						let count = 6;
						const timeout = setInterval(() => {
							setInstallNum(--count);
							if (count <= 0) {
								clearInterval(timeout);
								getData();
							}
						}, 1000);
					});
				}
			});
		} else if (record.versionStatus === 'canUpgrade') {
			const dialog = Dialog.show({
				title: '操作确认',
				content: 'operator升级中,请稍后升级',
				footer: (
					<Button type="primary" onClick={() => dialog.hide()}>
						我知道了
					</Button>
				)
			});
		} else {
			return;
		}
	};

	// useEffect(() => {
	// 	const timeout = setTimeout(() => {
	// 		let count: any = installNum;
	// 		setInstallNum(count--);
	// 		console.log(count);

	// 		if(count <= 0){
	// 			clearInterval(timeout)
	// 		}
	// 	},1000)
	// },[installNum])

	return (
		<Page>
			<Header
				title={`服务版本管理`}
				hasBackArrow={true}
				onBackArrowClick={() => window.history.back()}
			/>
			<Content>
				<Message type="warning">
					本系统范围内其它资源池使用过的中间件版本，都可以自主选择是否安装升级到更新版本
				</Message>
				<div className="middleware-version-content">
					<Table
						dataSource={dataSource}
						exact
						fixedBarExpandWidth={[24]}
						affixActionBar
						showRefresh
						onRefresh={getData}
						primaryKey="key"
						onFilter={onFilter}
						onSort={onSort}
					>
						<Table.Column
							title="服务名称/中文名称"
							dataIndex="chartName"
							cell={() => url[url.length - 1]}
						/>
						<Table.Column
							title="类型"
							dataIndex="chartName"
							cell={iconTypeRender}
						/>
						<Table.Column title="描述" dataIndex="description" />
						<Table.Column
							title="版本状态"
							dataIndex="versionStatus"
							cell={versionStatusRender}
							filters={[
								{ label: '当前版本', value: 'now' },
								{ label: '可安装升级版本', value: 'future' },
								{ label: '历史版本', value: 'history' },
								{ label: '升级中', value: '升级中' }
							]}
							filterMode="single"
							width={200}
						/>
						<Table.Column
							title="版本"
							dataIndex="chartVersion"
							width={100}
						/>
						<Table.Column
							title="上架时间"
							dataIndex="createTime"
							cell={(text: string) => (
								<span>
									{moment(text).format('YYYY-MM-DD h:mm:ss')}
								</span>
							)}
							width={200}
							sortable
						/>
						<Table.Column
							title="操作"
							dataIndex="action"
							width={150}
							cell={actionRender}
						/>
					</Table>
				</div>
			</Content>
			{visible && (
				<UploadMiddlewareForm
					visible={visible}
					onCancel={() => setVisible(false)}
					onCreate={onCreate}
				/>
			)}
		</Page>
	);
}
const mapStateToProps = (state: StoreState) => ({
	globalVar: state.globalVar
});
export default connect(mapStateToProps, {})(ServiceVersion);
