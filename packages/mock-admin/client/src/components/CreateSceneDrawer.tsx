import { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message } from 'antd';
import { createScene } from '../api/mock';
import JsonEditor from './JsonEditor';

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


  return (
    <Drawer
      title={`添加场景 - ${apiName}`}
      open={visible}
      onClose={handleCancel}
      width="min(90vw, 900px)"
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
          <JsonEditor
            value={content}
            onChange={setContent}
            height="350px"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
