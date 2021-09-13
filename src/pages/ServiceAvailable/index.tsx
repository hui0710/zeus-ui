import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
	Button,
	Message,
	Dialog,
	Checkbox,
	Balloon,
	Icon
} from '@alicloud/console-components';
import { Page, Content, Header } from '@alicloud/console-components-page';
import Actions, { LinkButton } from '@alicloud/console-components-actions';
import moment from 'moment';
import Table from '@/components/MidTable';
import RapidScreening from '@/components/RapidScreening';
import messageConfig from '@/components/messageConfig';
import { listProps } from '@/components/RapidScreening';
import { StoreState, globalVarProps } from '@/types/index';
import {
	serviceAvailableItemProps,
	serviceAvailablesProps
} from './service.available';
import { iconTypeRender, timeRender } from '@/utils/utils';
import CustomIcon from '@/components/CustomIcon';
import AddIngress from '../Ingress/addIngress';
import {
	getIngresses,
	deleteIngress,
	addIngress,
	getIngressMid
} from '@/services/ingress';

interface stateProps {
	middlewareName: string;
}
interface serviceAvailableProps {
	globalVar: globalVarProps;
}
function ServiceAvailable(props: serviceAvailableProps) {
	const { cluster, namespace } = props.globalVar;
	const [selected, setSelected] = useState<string>('全部服务');
	const [originData, setOriginData] = useState<serviceAvailablesProps[]>([]);
	const [dataSource, setDataSource] = useState<serviceAvailableItemProps[]>(
		[]
	);
	const [showDataSource, setShowDataSource] = useState<
		serviceAvailableItemProps[]
	>([]);
	const [active, setActive] = useState<boolean>(false);
	const [list, setList] = useState<listProps[]>([
		{ name: '全部服务', count: 0 }
	]);
	const [keyword, setKeyword] = useState<string>('');
	const location = useLocation();
	useEffect(() => {
		let mounted = true;
		if (JSON.stringify(namespace) !== '{}') {
			if (mounted) {
				getIngresses({
					clusterId: cluster.id,
					namespace: namespace.name,
					keyword
				}).then((res) => {
					console.log(res);
					if (mounted) {
						setOriginData(res.data);
						const listTemp = [...list];
						res?.data.forEach((item: serviceAvailablesProps) => {
							listTemp.push({
								name: item.name,
								count: item.serviceNum
							});
						});
						listTemp[0].count = listTemp.reduce(
							(pre, cur: listProps) => {
								return pre + cur.count;
							},
							0
						);
						setList(listTemp);
					}
				});
			}
		}
		return () => {
			mounted = false;
		};
	}, [props]);
	useEffect(() => {
		if (selected !== '全部服务') {
			setShowDataSource(
				originData.filter((item) => item.chartName === selected)[0]
					.ingressList
			);
		} else {
			setShowDataSource(dataSource);
		}
	}, [selected]);
	useEffect(() => {
		const allList: serviceAvailableItemProps[] = [];
		originData.forEach((item) => {
			item.ingressList.length > 0 &&
				item.ingressList.forEach((i) => {
					i.imagePath = item.imagePath;
					allList.push(i);
				});
		});
		setDataSource(allList);
		setShowDataSource(allList);
	}, [originData]);
	const getData = () => {
		const sendData = {
			clusterId: cluster.id,
			namespace: namespace.name,
			keyword
		};
		getIngresses(sendData).then((res) => {
			if (res.success) {
				setOriginData(res.data);
			} else {
				Message.show(messageConfig('error', '失败', res));
			}
		});
	};
	const handleSearch = (value: string) => {
		setKeyword(value);
		// getData(globalVar.cluster.id, globalVar.namespace.name, value);
	};
	const handleDelete = (record: serviceAvailableItemProps) => {
		Dialog.show({
			title: '操作确认',
			content:
				'删除对外路由会影响当前正在通过对外地址访问中间件的服务，请确认执行',
			onOk: () => {
				const sendData = {
					...record,
					clusterId: cluster.id,
					middlewareName: record.middlewareName,
					name: record.name,
					namespace: record.namespace
				};
				return deleteIngress(sendData)
					.then((res) => {
						if (res.success) {
							Message.show(
								messageConfig(
									'success',
									'成功',
									'对外路由删除成功'
								)
							);
						} else {
							Message.show(messageConfig('error', '失败', res));
						}
					})
					.finally(() => {
						console.log('refresh list data');
						// entry !== 'detail'
						// 	? getData(
						// 			globalVar.cluster.id,
						// 			globalVar.namespace.name
						// 	  )
						// 	: getIngressByMid(
						// 			globalVar.cluster.id,
						// 			globalVar.namespace.name,
						// 			type,
						// 			middlewareName
						// 	  );
					});
			}
		});
	};
	const onCreate = (values: any) => {
		const sendData =
			values.protocol === 'HTTP'
				? {
						clusterId: cluster.id,
						namespace: namespace.name,
						exposeType: values.exposeType,
						middlewareName: values.middlewareName,
						middlewareType: values.selectedInstance.type,
						protocol: values.protocol,
						rules: [
							{
								domain: values.domain,
								ingressHttpPaths: [
									{
										path: values.path,
										serviceName: values.serviceName,
										servicePort: values.servicePort
									}
								]
							}
						]
				  }
				: {
						clusterId: cluster.id,
						namespace: namespace.name,
						exposeType: values.exposeType,
						middlewareName: values.middlewareName,
						middlewareType: values.selectedInstance.type,
						protocol: values.protocol,
						serviceList: [
							{
								exposePort: values.exposePort,
								serviceName: values.serviceName,
								servicePort: values.servicePort,
								targetPort:
									values.selectedService.portDetailDtoList[0]
										.targetPort
							}
						]
				  };
		addIngress(sendData).then((res) => {
			if (res.success) {
				Message.show(
					messageConfig('success', '成功', '对外路由添加成功')
				);
				setActive(false);
				getData();
				// entry !== 'detail'
				// 	? getData(globalVar.cluster.id, globalVar.namespace.name)
				// 	: getIngressByMid(
				// 			globalVar.cluster.id,
				// 			globalVar.namespace.name,
				// 			type,
				// 			middlewareName
				// 	  );
			} else {
				Message.show(messageConfig('error', '失败', res));
			}
		});
	};
	const Operation = {
		primary: (
			<Button onClick={() => setActive(true)} type="primary">
				暴露服务
			</Button>
		)
	};
	const nameRender = (value: string, index: number, record: any) => {
		return <div className="name-link">{value}</div>;
	};
	// * 浏览器复制到剪切板方法
	const copyValue = (value: any) => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.style.position = 'absolute';
		input.style.top = '0px';
		input.style.opacity = '0';
		input.value = value;
		input.focus();
		input.select();
		if (document.execCommand('copy')) {
			document.execCommand('copy');
		}
		input.blur();
		document.body.removeChild(input);
		Message.show(messageConfig('success', '成功', '复制成功'));
	};
	const addressRender = (value: string, index: number, record: any) => {
		if (record.protocol === 'HTTP') {
			const address = `${record.rules[0].domain}:${record.httpExposePort}${record.rules[0].ingressHttpPaths[0].path}`;
			return (
				<>
					<CustomIcon
						type="icon-fuzhi"
						size="xs"
						onClick={() => copyValue(address)}
					/>
					{address}
					{/* <span
						className="name-link"
						style={{ marginLeft: 12 }}
						onClick={() => copyValue(address)}
					>
						复制
					</span> */}
				</>
			);
		} else {
			return (
				<div className="ingress-balloon-content">
					<div className="ingress-balloon-list-content">
						{record.serviceList &&
							record.serviceList.map(
								(item: any, index: number) => {
									const address = `${record.exposeIP}:${item.exposePort}`;
									if (index > 1) {
										return null;
									}
									return (
										<div key={index}>
											<CustomIcon
												type="icon-fuzhi"
												size="xs"
												onClick={() =>
													copyValue(address)
												}
											/>
											{address}
											{/* <span
												className="name-link"
												style={{ marginLeft: 12 }}
												onClick={() =>
													copyValue(address)
												}
											>
												复制
											</span> */}
										</div>
									);
								}
							)}
					</div>
					{record.serviceList.length > 2 && (
						<Balloon
							trigger={
								<span className="tips-more">
									<Icon size="xs" type="ellipsis" />
								</span>
							}
							closable={false}
						>
							{record.serviceList.map(
								(item: any, index: number) => {
									const address = `${record.exposeIP}:${item.exposePort}`;
									return (
										<div
											key={index}
											className="balloon-tips"
										>
											{address}
											<span
												className="name-link"
												style={{ marginLeft: 12 }}
												onClick={() =>
													copyValue(address)
												}
											>
												复制
											</span>
										</div>
									);
								}
							)}
						</Balloon>
					)}
				</div>
			);
		}
	};
	const middlewareNameRender = (
		value: string,
		index: number,
		record: serviceAvailableItemProps
	) => {
		return (
			<div className="display-flex flex-align">
				{record?.isDisasterRecovery && (
					<div className="gray-circle">备</div>
				)}
				<div>
					<div className="name-link">{record.middlewareName}</div>
					<div>{record.middlewareNickName}</div>
				</div>
			</div>
		);
	};
	const portRender = (value: string, index: number, record: any) => {
		const port =
			record.protocol === 'HTTP'
				? record.rules[0].ingressHttpPaths[0].servicePort
				: record.serviceList[0].servicePort;
		return <span>{port}</span>;
	};
	const actionRender = (value: string, index: number, record: any) => {
		return (
			<Actions>
				<LinkButton onClick={() => handleDelete(record)}>
					删除
				</LinkButton>
			</Actions>
		);
	};
	const onSort = (dataIndex: string, order: string) => {
		if (dataIndex === 'createTime') {
			const tempDataSource = dataSource.sort((a, b) => {
				const result = a['createTimeNum'] - b['createTimeNum'];
				return order === 'asc'
					? result > 0
						? 1
						: -1
					: result > 0
					? -1
					: 1;
			});
			setShowDataSource([...tempDataSource]);
		} else if (dataIndex === 'exposeType') {
			const tempDataSource = dataSource.sort((a, b) => {
				const result = a['exposeType'].length - b['exposeType'].length;
				return order === 'asc'
					? result > 0
						? 1
						: -1
					: result > 0
					? -1
					: 1;
			});
			setShowDataSource([...tempDataSource]);
		} else if (dataIndex === 'protocol') {
			const tempDataSource = dataSource.sort((a, b) => {
				const result = a['protocol'].length - b['protocol'].length;
				return order === 'asc'
					? result > 0
						? 1
						: -1
					: result > 0
					? -1
					: 1;
			});
			setShowDataSource([...tempDataSource]);
		}
	};
	return (
		<Page>
			<Header
				title="服务暴露"
				subTitle="通过Nginx-Ingress/NodePort等多种方式对外暴露已发布的不同类型中间件服务"
			/>
			<Content>
				<RapidScreening
					list={list}
					selected={selected}
					changeSelected={(value: string) => setSelected(value)}
				/>
				<Table
					dataSource={showDataSource}
					exact
					fixedBarExpandWidth={[24]}
					affixActionBar
					showColumnSetting
					showRefresh
					onRefresh={() => console.log('refresh data')}
					primaryKey="key"
					operation={Operation}
					search={{
						onSearch: handleSearch,
						placeholder: '请输入搜索内容'
					}}
					onSort={onSort}
				>
					<Table.Column
						title="暴露服务名称"
						dataIndex="name"
						cell={nameRender}
					/>
					<Table.Column
						title="服务名称/中文别名"
						dataIndex="middlewareName"
						cell={middlewareNameRender}
					/>
					<Table.Column
						title="服务类型"
						dataIndex="middlewareType"
						cell={iconTypeRender}
					/>
					<Table.Column
						title="暴露方式"
						dataIndex="exposeType"
						sortable={true}
					/>
					<Table.Column
						title="协议"
						dataIndex="protocol"
						sortable={true}
					/>
					<Table.Column title="访问地址" cell={addressRender} />
					<Table.Column
						title="实例端口"
						dataIndex="httpExposePort"
						cell={portRender}
					/>
					<Table.Column
						title="创建时间"
						dataIndex="creatTime"
						sortable={true}
						cell={timeRender}
					/>
					<Table.Column
						title="操作"
						dataIndex="action"
						cell={actionRender}
						width={188}
						lock="right"
					/>
				</Table>
			</Content>
			{/* {active && (
				<AddIngress
					active={active}
					onCreate={onCreate}
					onCancel={() => setActive(false)}
					entry={entry}
					middlewareName={middlewareName}
				/>
			)} */}
		</Page>
	);
}
const mapStateToProps = (state: StoreState) => ({
	globalVar: state.globalVar
});
export default connect(mapStateToProps, {})(ServiceAvailable);
