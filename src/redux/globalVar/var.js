export const SET_CLUSTER = 'SET_CLUSTER';
export const SET_NAMESPACE = 'SET_NAMESPACE';
export const SET_REFRESH_CLUSTER = 'SET_REFRESH_CLUSTER';
export const SET_GLOBAL_CLUSTER_LIST = 'SET_GLOBAL_CLUSTER_LIST';
export const SET_GLOBAL_NAMESPACE_LIST = 'SET_GLOBAL_NAMESPACE_LIST';

export function setCluster(cluster) {
	return (dispatch) => {
		dispatch({
			type: SET_CLUSTER,
			data: cluster
		});
	};
}

export function setNamespace(namespace) {
	return (dispatch) => {
		dispatch({
			type: SET_NAMESPACE,
			data: namespace
		});
	};
}

export function setRefreshCluster(flag) {
	return (dispatch) => {
		dispatch({
			type: SET_REFRESH_CLUSTER,
			data: flag
		});
	};
}
export function setGlobalClusterList(clusterList) {
	return (dispatch) => {
		dispatch({
			type: SET_GLOBAL_CLUSTER_LIST,
			data: clusterList
		});
	};
}

export function setGlobalNamespaceList(namespaceList) {
	return (dispatch) => {
		dispatch({
			type: SET_GLOBAL_NAMESPACE_LIST,
			data: namespaceList
		});
	};
}
