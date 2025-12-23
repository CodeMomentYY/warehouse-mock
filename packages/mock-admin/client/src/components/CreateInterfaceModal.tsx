import { useState } from 'react';
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import { createInterface } from '../api/mock';

interface CreateInterfaceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateInterfaceModal({ visible, onClose, onSuccess }: CreateInterfaceModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      setLoading(true);
      await createInterface(values.name, values.delay || 0, values.enabled !== false);
      message.success('接口创建成功，请添加场景');
      form.resetFields();
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
    onClose();
  };

  return (
    <Modal
      title="添加 Mock 数据"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={500}
      okText="创建"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ enabled: true, delay: 0 }}
      >
        <Form.Item
          label="接口名称"
          name="name"
          rules={[
            { required: true, message: '请输入接口名称' },
            { pattern: /^[a-zA-Z0-9._/-]+$/, message: '只能包含字母、数字、点、下划线、中划线、斜杠' }
          ]}
          extra="RPC 格式示例：user.account.getInfo 或 RESTful 格式：api/user/info"
        >
          <Input placeholder="user.account.getInfo" />
        </Form.Item>

        <Form.Item
          label="接口延时（毫秒）"
          name="delay"
          extra="模拟网络延迟，默认为 0ms"
        >
          <InputNumber
            min={0}
            max={10000}
            step={100}
            style={{ width: '100%' }}
            placeholder="0"
          />
        </Form.Item>

        <Form.Item
          label="Mock 开启"
          name="enabled"
          valuePropName="checked"
          extra="关闭后该接口不会被拦截"
        >
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>
      </Form>

      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        background: '#f0f5ff', 
        borderRadius: 4, 
        border: '1px solid #d6e4ff',
        color: '#0050b3',
        fontSize: 13
      }}>
        <div style={{ marginBottom: 4, fontWeight: 500 }}>💡 提示</div>
        <div>创建接口后，请在列表中点击"添加"按钮来添加场景数据</div>
      </div>
    </Modal>
  );
}

