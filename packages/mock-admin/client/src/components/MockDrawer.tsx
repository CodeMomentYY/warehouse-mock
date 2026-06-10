import { useState, useEffect } from 'react';
import { Drawer, Button, Space, message, Spin, Input } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getSceneDetail, updateScene } from '../api/mock';
import JsonEditor from './JsonEditor';

interface MockDrawerProps {
  visible: boolean;
  apiName: string;
  scene: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MockDrawer({ visible, apiName, scene, onClose, onSuccess }: MockDrawerProps) {
  const [sceneName, setSceneName] = useState(scene);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && apiName && scene) {
      setSceneName(scene);
      loadData();
    }
  }, [visible, apiName, scene]);

  const loadData = async () => {
    setLoading(true);
    try {
      const detail = await getSceneDetail(apiName, scene);
      setContent(detail.content);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // 验证场景名称
    if (!sceneName || !sceneName.trim()) {
      message.error('场景名称不能为空');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(sceneName)) {
      message.error('场景名称只能包含字母、数字、下划线、中划线');
      return;
    }

    // 验证 JSON
    try {
      JSON.parse(content);
    } catch (e) {
      message.error('JSON 格式错误，请检查');
      return;
    }

    setSaving(true);
    try {
      await updateScene(apiName, scene, sceneName, content);
      message.success('保存成功');
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };


  return (
    <Drawer
      title={`编辑场景 - ${apiName} / ${scene}`}
      open={visible}
      onClose={onClose}
      width="min(90vw, 900px)"
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            场景名称
          </label>
          <Input
            value={sceneName}
            onChange={e => setSceneName(e.target.value)}
            placeholder="default"
            style={{ marginBottom: 12 }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            修改后文件名也会同步修改
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Mock 数据
          </label>
        </div>

        <JsonEditor
          value={content}
          onChange={setContent}
          height="calc(100vh - 380px)"
        />
      </Spin>
    </Drawer>
  );
}
