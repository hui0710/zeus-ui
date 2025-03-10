import React, { useState } from 'react';
import { useHistory } from 'react-router';
import SecondLayout from '@/components/SecondLayout';
import Disaster from '@/pages/InstanceList/Detail/Disaster';
import { Message, Dialog, Button } from '@alicloud/console-components';
import { getMiddlewareDetail } from '@/services/middleware';
import messageConfig from '@/components/messageConfig';
import NoService from '@/components/NoService';
import storage from '@/utils/storage';
import { getNamespaces } from '@/services/common';
import { middlewareDetailProps, basicDataProps } from '@/types/comment';
import { clusterType, StoreState, globalVarProps } from '@/types';
import {
	setCluster,
	setNamespace,
	setRefreshCluster
} from '@/redux/globalVar/var';
import { connect } from 'react-redux';

interface disasterCenterProps {
	globalVar: globalVarProps;
}
function DisasterCenter(props: disasterCenterProps) {
	const [data, setData] = useState<middlewareDetailProps>();
	const [basicData, setBasicData] = useState<basicDataProps>();
	const [isService, setIsService] = useState<boolean>(false);
	const [visible, setVisible] = useState<boolean>(false);
	const {
		clusterList: globalClusterList,
		namespaceList: globalNamespaceList
	} = props.globalVar;
	const history = useHistory();
	const onChange = (
		name: string,
		type: string,
		namespace: string,
		cluster: clusterType
	) => {
		if (name !== type) {
			setBasicData({
				name,
				type,
				clusterId: cluster.id,
				namespace
			});
			getMiddlewareDetail({
				clusterId: cluster.id,
				namespace,
				type,
				middlewareName: name
			}).then((res) => {
				if (res.success) {
					setIsService(true);
					setData(res.data);
				} else {
					Message.show(messageConfig('error', '失败', res));
				}
			});
		} else {
			setIsService(false);
		}
	};
	const getData = () => {
		getMiddlewareDetail({
			clusterId: basicData?.clusterId,
			namespace: basicData?.namespace,
			type: basicData?.type,
			middlewareName: basicData?.name
		}).then((res) => {
			if (res.success) {
				setData(res.data);
			} else {
				Message.show(messageConfig('error', '失败', res));
			}
		});
	};
	const unAcrossCluster = () => {
		const cs = globalClusterList.filter(
			(item) =>
				item.id ===
				(data as middlewareDetailProps).mysqlDTO.relationClusterId
		);
		setCluster(cs[0]);
		storage.setLocal('cluster', JSON.stringify(cs[0]));
		const ns = globalNamespaceList.filter(
			(item) =>
				item.name ===
				(data as middlewareDetailProps).mysqlDTO.relationNamespace
		);
		setNamespace(ns[0]);
		storage.setLocal('namespace', JSON.stringify(ns[0]));
		setRefreshCluster(true);
		history.push({
			pathname: `/instanceList/detail/${
				(data as middlewareDetailProps).mysqlDTO.relationName
			}/${(data as middlewareDetailProps).mysqlDTO.type || 'mysql'}/${
				(data as middlewareDetailProps).chartVersion
			}`,
			state: {
				flag: true
			}
		});
	};
	const acrossCluster = () => {
		const cs = globalClusterList.filter(
			(item) =>
				item.id ===
				(data as middlewareDetailProps).mysqlDTO.relationClusterId
		);
		setCluster(cs[0]);
		storage.setLocal('cluster', JSON.stringify(cs[0]));
		getNamespaces({
			clusterId: cs[0].id,
			withQuota: true
		}).then((res) => {
			if (res.success) {
				if (res.data.length > 0) {
					const ns = res.data.filter(
						(item: clusterType) =>
							item.name ===
							(data as middlewareDetailProps).mysqlDTO
								.relationNamespace
					);
					setNamespace(ns[0]);
					storage.setLocal('namespace', JSON.stringify(ns[0]));
					setRefreshCluster(true);
					history.push({
						pathname: `/serviceList/basicInfo/${
							(data as middlewareDetailProps).mysqlDTO
								.relationName
						}/${
							(data as middlewareDetailProps).mysqlDTO.type ||
							'mysql'
						}/${(data as middlewareDetailProps).chartVersion}`,
						state: {
							flag: true
						}
					});
				}
			}
		});
	};
	const SecondConfirm = (props: {
		visible: boolean;
		onCancel: () => void;
	}) => {
		const { visible, onCancel } = props;
		const onOk = () => {
			storage.setLocal('firstAlert', 1);
			onCancel();
			acrossCluster();
		};
		const onConfirm = () => {
			onCancel();
			acrossCluster();
		};
		return (
			<Dialog
				title="操作确认"
				visible={visible}
				footerAlign="right"
				footer={
					<div>
						<Button type="primary" onClick={onOk}>
							好的，下次不在提醒
						</Button>
						<Button type="normal" onClick={onConfirm}>
							确认
						</Button>
					</div>
				}
			>
				该备用服务不在当前资源池资源分区，返回源服务页面请点击右上角“返回源服务”按钮
			</Dialog>
		);
	};
	const toDetail = () => {
		// * 源示例和备服务在用一个资源池时
		if (
			(data as middlewareDetailProps).mysqlDTO.relationClusterId ===
			basicData?.clusterId
		) {
			unAcrossCluster();
		} else {
			// across the cluster
			const flag = storage.getLocal('firstAlert');
			if (flag === 0) {
				setVisible(true);
			} else {
				acrossCluster();
			}
		}
	};
	const NotSupport = () => (
		<h3 style={{ textAlign: 'center' }}>
			该中间件类型不支持该功能，请选择mysql类型的中间件
		</h3>
	);
	return (
		<SecondLayout
			title="灾备中心"
			subTitle="为保障中间件服务高可用性，可跨资源池创建备用服务，随时接手主服务的数据流量"
			hasBackArrow={true}
			onChange={onChange}
		>
			{basicData?.type !== 'mysql' && isService && <NotSupport />}
			{basicData?.type === 'mysql' &&
				isService &&
				JSON.stringify(data) !== '{}' && (
					<Disaster
						chartName={basicData?.type || ''}
						chartVersion={data?.chartVersion || ''}
						middlewareName={basicData?.name || ''}
						clusterId={basicData?.clusterId || ''}
						namespace={basicData?.namespace || ''}
						data={data}
						onRefresh={getData}
						toDetail={toDetail}
					/>
				)}
			{!isService && <NoService />}
			<SecondConfirm
				visible={visible}
				onCancel={() => setVisible(false)}
			/>
		</SecondLayout>
	);
}
const mapStateToProps = (state: StoreState) => ({
	globalVar: state.globalVar
});
export default connect(mapStateToProps, {
	setCluster,
	setNamespace,
	setRefreshCluster
})(DisasterCenter);
