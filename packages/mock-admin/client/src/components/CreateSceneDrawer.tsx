import { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message } from 'antd';
import { FormatPainterOutlined, CompressOutlined } from '@ant-design/icons';
import { createScene } from '../api/mock';

const { TextArea } = Input;

interface CreateSceneDrawerProps {
  visible: boolean;
  apiName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultTemplate = `{
  "code": 0,
  "msg": "success",
  "data": {}
}`;

const templates = [
  { label: '默认模板', value: 'default', content: defaultTemplate },
  {
    label: '成功响应',
    value: 'success',
    content: `{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "name": "示例"
  }
}`
  },
  {
    label: '错误响应',
    value: 'error',
    content: `{
  "code": -1,
  "msg": "操作失败",
  "data": null
}`
  },
  {
    label: '列表响应',
    value: 'list',
    content: `{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [],
    "total": 0,
    "pageNum": 1,
    "pageSize": 10
  }
}`
  },
];

export default function CreateSceneDrawer({ visible, apiName, onClose, onSuccess }: CreateSceneDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(defaultTemplate);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setContent(defaultTemplate);
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证 JSON
      let jsonData;
      try {
        jsonData = JSON.parse(content);
      } catch (e) {
        message.error('JSON 格式错误，请检查');
        return;
      }

      setLoading(true);
      await createScene(apiName, values.sceneName, jsonData);
      message.success('场景创建成功');
      form.resetFields();
      setContent(defaultTemplate);
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.message) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setContent(defaultTemplate);
    onClose();
  };

  const handleTemplateChange = (value: string) => {
    const template = templates.find(t => t.value === value);
    if (template) {
      setContent(template.content);
    }
  };

  const handleFormat = () => {
    try {
      const jsonData = JSON.parse(content);
      setContent(JSON.stringify(jsonData, null, 2));
      message.success('格式化成功');
    } catch (e) {
      message.error('JSON 格式错误，无法格式化');
    }
  };

  const handleMinify = () => {
    try {
      const jsonData = JSON.parse(content);
      setContent(JSON.stringify(jsonData));
      message.success('压缩成功');
    } catch (e) {
      message.error('JSON 格式错误，无法压缩');
    }
  };

  return (
    <Drawer
      title={`添加场景 - ${apiName}`}
      open={visible}
      onClose={handleCancel}
      width={600}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              创建
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ template: 'default', sceneName: 'default' }}
      >
        <Form.Item
          label="场景名称"
          name="sceneName"
          rules={[
            { required: true, message: '请输入场景名称' },
            { pattern: /^[a-zA-Z0-9_-]+$/, message: '只能包含字母、数字、下划线、中划线' }
          ]}
          extra="常用场景名：default、success、error、empty 等"
        >
          <Input placeholder="default" />
        </Form.Item>

        <Form.Item
          label="选择模板"
          name="template"
        >
          <Select
            options={templates.map(t => ({ label: t.label, value: t.value }))}
            onChange={handleTemplateChange}
          />
        </Form.Item>

        <Form.Item label="Mock 数据">
          <TextArea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={16}
            style={{
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
              fontSize: 13,
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              border: '1px solid #2d2d2d',
              lineHeight: '1.6'
            }}
          />
          <div style={{ marginTop: 8 }}>
            <Space>
              <Button
                size="small"
                icon={<FormatPainterOutlined />}
                onClick={handleFormat}
              >
                格式化
              </Button>
              <Button
                size="small"
                icon={<CompressOutlined />}
                onClick={handleMinify}
              >
                压缩
              </Button>
            </Space>
          </div>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
