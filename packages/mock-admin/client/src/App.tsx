import { useState, useEffect } from 'react';
import { Layout, Input, Button, Switch, Tag, Space, message, Spin, Empty, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { getMockList, deleteInterface, deleteScene, activateScene, updateInterface, type MockItem } from './api/mock';
import MockDrawer from './components/MockDrawer';
import CreateInterfaceModal from './components/CreateInterfaceModal';
import CreateSceneDrawer from './components/CreateSceneDrawer';
import EditInterfaceModal from './components/EditInterfaceModal';
import './App.css';

const { Header, Sider, Content } = Layout;

function App() {
  const [mockList, setMockList] = useState<MockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // 创建接口弹窗
  const [createInterfaceVisible, setCreateInterfaceVisible] = useState(false);
  
  // 添加场景抽屉
  const [createSceneVisible, setCreateSceneVisible] = useState(false);
  const [createSceneApiName, setCreateSceneApiName] = useState('');
  
  // 编辑接口配置弹窗
  const [editInterfaceVisible, setEditInterfaceVisible] = useState(false);
  const [editInterfaceApiName, setEditInterfaceApiName] = useState('');
  
  // 编辑场景数据抽屉
  const [editSceneVisible, setEditSceneVisible] = useState(false);
  const [editSceneApi, setEditSceneApi] = useState<{ apiName: string; scene: string } | null>(null);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const list = await getMockList();
      setMockList(list);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开添加场景抽屉
  const handleAddScene = (apiName: string) => {
    setCreateSceneApiName(apiName);
    setCreateSceneVisible(true);
  };

  // 打开编辑接口配置弹窗
  const handleEditInterface = (apiName: string) => {
    setEditInterfaceApiName(apiName);
    setEditInterfaceVisible(true);
  };

  // 打开编辑场景数据抽屉
  const handleEditScene = (apiName: string, scene: string) => {
    setEditSceneApi({ apiName, scene });
    setEditSceneVisible(true);
  };

  // 删除接口
  const handleDeleteInterface = async (apiName: string) => {
    try {
      await deleteInterface(apiName);
      message.success('接口删除成功');
      loadList();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 删除场景
  const handleDeleteScene = async (apiName: string, sceneName: string) => {
    try {
      await deleteScene(apiName, sceneName);
      message.success('场景删除成功');
      loadList();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 激活场景
  const handleActivateScene = async (apiName: string, sceneName: string) => {
    try {
      await activateScene(apiName, sceneName);
      message.success(`已切换到场景：${sceneName}`);
      loadList();
    } catch (error: any) {
      message.error(error.message || '激活场景失败');
    }
  };

  // 切换接口开关
  const handleToggleEnabled = async (apiName: string, enabled: boolean, delay: number) => {
    try {
      await updateInterface(apiName, apiName, delay, enabled);
      message.success(enabled ? '接口已开启' : '接口已关闭');
      loadList();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const filteredList = mockList.filter(mock =>
    mock.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 场景标签颜色映射
  const getSceneColor = (scene: string, isActive: boolean) => {
    if (isActive) return 'blue';
    if (scene === 'success') return 'green';
    if (scene === 'error') return 'red';
    if (scene.startsWith('mockjs_')) return 'cyan';
    return 'default';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧边栏 */}
      <Sider width={200} className="site-sider">
        <div className="sider-header">
          <div className="sider-title">Warehouse Mock</div>
        </div>
        <div className="sider-menu">
          <div className={`menu-item active`}>
            <span className="menu-icon">📋</span>
            <span>Mock 列表</span>
          </div>
        </div>
      </Sider>

      <Layout>
        {/* 顶部搜索栏 */}
        <Header className="site-header">
          <Input
            className="search-input"
            placeholder="搜索接口名称"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateInterfaceVisible(true)}
          >
            添加mock数据
          </Button>
        </Header>

        {/* 主内容区 */}
        <Content className="site-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : filteredList.length === 0 ? (
            <Empty description="暂无数据" style={{ marginTop: '50px' }}>
              <Button type="primary" onClick={() => setCreateInterfaceVisible(true)}>
                立即创建
              </Button>
            </Empty>
          ) : (
            <div className="mock-list">
              {filteredList.map(mock => {
                const hasScenes = mock.scenes.length > 0;
                const activeScene = mock.activeScene || 'default';

                return (
                  <div key={mock.name} className="mock-item">
                    <div className="mock-item-header">
                      <Space size="middle" style={{ flex: 1 }}>
                        {/* 开关 */}
                        <Switch 
                          checked={mock.enabled}
                          checkedChildren="开启" 
                          unCheckedChildren="关闭"
                          onChange={(checked) => handleToggleEnabled(mock.name, checked, mock.delay)}
                        />
                        
                        {/* 接口路径 */}
                        <span className="api-path">{mock.name}</span>
                        
                        {/* 延时标签 */}
                        {mock.delay > 0 && (
                          <Tag color="orange">延时 {mock.delay}ms</Tag>
                        )}
                      </Space>

                      {/* 右侧操作按钮 */}
                      <Space>
                        <Button 
                          type="primary"
                          icon={<SettingOutlined />}
                          onClick={() => handleEditInterface(mock.name)}
                        >
                          修改配置
                        </Button>
                        <Popconfirm
                          title="确定要删除这个接口吗？"
                          description="删除后将无法恢复"
                          onConfirm={() => handleDeleteInterface(mock.name)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button 
                            danger
                            icon={<DeleteOutlined />}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>

                    {/* 场景标签区域 */}
                    <div className="mock-item-scenes">
                      {hasScenes ? (
                        <Space size={8} wrap>
                          {mock.scenes.map(scene => {
                            const isActive = scene === activeScene;
                            return (
                              <Tag
                                key={scene}
                                color={getSceneColor(scene, isActive)}
                                className={`scene-tag ${isActive ? 'active' : ''}`}
                                style={{ 
                                  cursor: 'pointer',
                                  padding: '4px 12px',
                                  borderRadius: '12px'
                                }}
                                onClick={() => !isActive && handleActivateScene(mock.name, scene)}
                              >
                                {scene}
                                <EditOutlined 
                                  style={{ marginLeft: 8, fontSize: 12 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditScene(mock.name, scene);
                                  }}
                                />
                                {mock.scenes.length > 1 && (
                                  <Popconfirm
                                    title="确定要删除这个场景吗？"
                                    onConfirm={(e) => {
                                      e?.stopPropagation();
                                      handleDeleteScene(mock.name, scene);
                                    }}
                                    okText="确定"
                                    cancelText="取消"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DeleteOutlined 
                                      style={{ marginLeft: 4, fontSize: 12 }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </Popconfirm>
                                )}
                              </Tag>
                            );
                          })}
                          {/* 添加场景按钮 */}
                          <Button 
                            type="link" 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => handleAddScene(mock.name)}
                          >
                            添加
                          </Button>
                        </Space>
                      ) : (
                        <Button 
                          type="dashed"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddScene(mock.name)}
                        >
                          添加场景
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Content>
      </Layout>

      {/* 创建接口弹窗 */}
      <CreateInterfaceModal
        visible={createInterfaceVisible}
        onClose={() => setCreateInterfaceVisible(false)}
        onSuccess={loadList}
      />

      {/* 添加场景抽屉 */}
      <CreateSceneDrawer
        visible={createSceneVisible}
        apiName={createSceneApiName}
        onClose={() => {
          setCreateSceneVisible(false);
          setCreateSceneApiName('');
        }}
        onSuccess={loadList}
      />

      {/* 编辑接口配置弹窗 */}
      <EditInterfaceModal
        visible={editInterfaceVisible}
        apiName={editInterfaceApiName}
        onClose={() => {
          setEditInterfaceVisible(false);
          setEditInterfaceApiName('');
        }}
        onSuccess={loadList}
      />

      {/* 编辑场景数据抽屉 */}
      {editSceneApi && (
        <MockDrawer
          visible={editSceneVisible}
          apiName={editSceneApi.apiName}
          scene={editSceneApi.scene}
          onClose={() => {
            setEditSceneVisible(false);
            setEditSceneApi(null);
          }}
          onSuccess={loadList}
        />
      )}
    </Layout>
  );
}

export default App;
