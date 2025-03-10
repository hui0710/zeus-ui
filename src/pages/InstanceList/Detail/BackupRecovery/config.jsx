import React, { useState, useEffect } from 'react';
import {
	Dialog,
	Icon,
	Message,
	Switch,
	Balloon
} from '@alicloud/console-components';
import BackupSettingForm from './backupSetting';
import messageConfig from '@/components/messageConfig';
import { getBackupConfig, addBackupConfig, backupNow } from '@/services/backup';
import moment from 'moment';
import transTime from '@/utils/transTime';

const weekMap = {
	1: '星期一',
	2: '星期二',
	3: '星期三',
	4: '星期四',
	5: '星期五',
	6: '星期六',
	0: '星期日'
};
const listMap = {
	星期一: 1,
	星期二: 2,
	星期三: 3,
	星期四: 4,
	星期五: 5,
	星期六: 6,
	星期日: 0
};
export default function Config(props) {
	const { clusterId, namespace, data: listData } = props;
	const [visible, setVisible] = useState(false);
	const [backupData, setBackupData] = useState({
		configed: false,
		limitRecord: 0,
		cycle: '',
		time: '',
		nextBackupTime: '',
		pause: 'on',
		canPause: true
	});
	console.log(listData);

	useEffect(() => {
		if (
			clusterId !== undefined &&
			namespace !== undefined &&
			listData !== undefined
		) {
			getData();
		}
	}, [listData]);

	const getData = () => {
		const sendData = {
			clusterId,
			namespace,
			middlewareName: listData.name,
			type: listData.type
		};
		getBackupConfig(sendData).then((res) => {
			if (res.success) {
				if (res.data) {
					if (res.data.configed) {
						const cycleList = res.data.cron.split(' ');
						const weekTemp = cycleList[4].split(',');
						const cycle = weekTemp.map((item) => {
							return weekMap[item];
						});
						setBackupData({
							configed: res.data.configed,
							limitRecord: res.data.limitRecord,
							cycle: cycle.join(','),
							time: `${cycleList[1]}:${
								cycleList[0] === '0' ? '00' : cycleList[0]
							}`,
							nextBackupTime: res.data.nextBackupTime,
							pause: res.data.pause,
							canPause: res.data.canPause
						});
					} else {
						setBackupData({
							configed: res.data.configed,
							limitRecord: res.data.limitRecord,
							cycle: null,
							time: null,
							nextBackupTime: res.data.nextBackupTime,
							pause: res.data.pause,
							canPause: res.data.canPause
						});
					}
				}
			} else {
				Message.show(messageConfig('error', '失败', res));
			}
		});
	};

	const onCreate = (values) => {
		const minute = moment(values.time).get('minute');
		const hour = moment(values.time).get('hour');
		const week = values.cycle.join(',');
		const cron = `${minute} ${hour} ? ? ${week}`;

		const sendData = {
			clusterId,
			namespace,
			middlewareName: listData.name,
			type: listData.type,
			limitRecord: values.count,
			cron
		};
		if (backupData.configed) {
			addBackupConfig(sendData)
				.then((res) => {
					if (res.success) {
						Message.show(
							messageConfig('success', '成功', '备份设置成功')
						);
					} else {
						Message.show(messageConfig('error', '失败', res));
					}
				})
				.finally(() => {
					getData();
				});
		} else {
			backupNow(sendData)
				.then((res) => {
					if (res.success) {
						Message.show(
							messageConfig('success', '成功', '备份设置成功')
						);
					} else {
						Message.show(messageConfig('error', '失败', res));
					}
				})
				.finally(() => {
					getData();
				});
		}
		setVisible(false);
	};

	const backupStatusChange = (checked) => {
		if (listData.type === 'elasticsearch') {
			const list = [];
			for (let i in listData.quota) {
				list.push(listData.quota[i].storageClassName);
			}
			if (list.includes('local-path')) {
				Message.show(
					messageConfig(
						'error',
						'失败',
						'存储类型为local-path时不支持立即备份功能'
					)
				);
				return;
			}
		} else {
			if (listData.type === 'mysql' && !listData.mysqlDTO.isLvmStorage) {
				Message.show(
					messageConfig(
						'error',
						'失败',
						'存储不使用lvm时，不支持备份设置功能'
					)
				);
				return;
			}
			if (
				listData.quota[listData.type].storageClassName === 'local-path'
			) {
				Message.show(
					messageConfig(
						'error',
						'失败',
						'存储类型为local-path时不支持备份设置功能'
					)
				);
				return;
			}
		}
		if (!backupData.configed) {
			Message.show(messageConfig('error', '失败', '请先配置备份信息！'));
			return;
		}
		const arr = backupData.time.split(':');
		const week = backupData.cycle
			.split(',')
			.map((item) => listMap[item])
			.join(',');
		const cron = `${arr[1]} ${arr[0]} ? ? ${week}`;
		Dialog.show({
			title: '操作确认',
			content: checked
				? '请确认是否打开备份设置？'
				: '请确认是否关闭备份设置',
			onOk: () => {
				if (backupData.configed) {
					const sendData = {
						clusterId,
						namespace,
						middlewareName: listData.name,
						type: listData.type,
						limitRecord: backupData.limitRecord,
						pause: checked ? 'off' : 'on',
						cron
					};
					if (!checked && !backupData.canPause) {
						Message.show(
							messageConfig(
								'error',
								'失败',
								'当前中间件不支持此操作'
							)
						);
						return;
					}
					addBackupConfig(sendData).then((res) => {
						if (res.success) {
							Message.show(
								messageConfig(
									'success',
									'成功',
									`${
										checked
											? '备份设置开启成功'
											: '备份设置关闭成功'
									}`
								)
							);
							setBackupData({
								...backupData,
								pause: checked ? 'off' : 'on'
							});
							getData();
						} else {
							Message.show(messageConfig('error', '失败', res));
						}
					});
				} else {
					Message.show(
						messageConfig('error', '失败', '请先配置备份信息！')
					);
				}
			}
		});
	};

	return (
		<div style={{ marginTop: 24 }}>
			<div className="backup-setting" style={{ marginBottom: 24 }}>
				<div className="backup-title">备份设置</div>
				<div
					className="backup-action"
					onClick={() => {
						if (listData.type === 'elasticsearch') {
							const list = [];
							for (let i in listData.quota) {
								list.push(listData.quota[i].storageClassName);
							}
							if (list.includes('local-path')) {
								Message.show(
									messageConfig(
										'error',
										'失败',
										'存储类型为local-path时不支持立即备份功能'
									)
								);
								return;
							}
						} else {
							if (
								listData.type === 'mysql' &&
								!listData.mysqlDTO.isLvmStorage
							) {
								Message.show(
									messageConfig(
										'error',
										'失败',
										'存储不使用lvm时，不支持备份设置功能'
									)
								);
								return;
							}
							if (
								listData.quota[listData.type]
									.storageClassName === 'local-path'
							) {
								Message.show(
									messageConfig(
										'error',
										'失败',
										'存储类型为local-path时不支持立即备份功能'
									)
								);
								return;
							}
						}
						setVisible(true);
					}}
				>
					<Icon type="edit" /> 编辑
				</div>
			</div>
			<div className="backup-display-content">
				<div className="backup-setting">
					<div className="backup-label">备份状态</div>
					<div className="backup-value">
						<Switch
							onChange={backupStatusChange}
							checked={backupData.pause === 'off'}
						/>
						<span>
							{backupData.pause === 'off'
								? '执行备份中'
								: '备份已停止'}
						</span>
					</div>
				</div>
				<div
					className="backup-setting"
					style={{
						color:
							backupData.pause === 'off' ? '#666666' : '#9b9ea0'
					}}
				>
					<div
						className="backup-label"
						style={{
							color:
								backupData.pause === 'off'
									? '#666666'
									: '#9b9ea0'
						}}
					>
						备份保留个数{' '}
						<Balloon
							trigger={<Icon type="question-circle" size="xs" />}
							closable={false}
						>
							成功备份一次，保存一份备份文件，意味着保留最新的N份备份文件，超过数量的备份将自动删除
						</Balloon>
					</div>
					<div className="backup-value">{backupData.limitRecord}</div>
				</div>
				<div
					className="backup-setting"
					style={{
						color:
							backupData.pause === 'off' ? '#666666' : '#9b9ea0'
					}}
				>
					<div
						className="backup-label"
						style={{
							color:
								backupData.pause === 'off'
									? '#666666'
									: '#9b9ea0'
						}}
					>
						备份周期
					</div>
					<div className="backup-value">{backupData.cycle}</div>
				</div>
				<div
					className="backup-setting"
					style={{
						color:
							backupData.pause === 'off' ? '#666666' : '#9b9ea0'
					}}
				>
					<div
						className="backup-label"
						style={{
							color:
								backupData.pause === 'off'
									? '#666666'
									: '#9b9ea0'
						}}
					>
						备份时间
					</div>
					<div className="backup-value">{backupData.time}</div>
				</div>
				<div
					className="backup-setting"
					style={{
						color:
							backupData.pause === 'off' ? '#666666' : '#9b9ea0'
					}}
				>
					<div
						className="backup-label"
						style={{
							color:
								backupData.pause === 'off'
									? '#666666'
									: '#9b9ea0'
						}}
					>
						预计下次备份时间
					</div>
					<div className="backup-value">
						{transTime.gmt2local(backupData.nextBackupTime)}
					</div>
				</div>
			</div>
			{visible && (
				<BackupSettingForm
					visible={visible}
					onCreate={onCreate}
					onCancel={() => setVisible(false)}
					data={backupData}
				/>
			)}
		</div>
	);
}
