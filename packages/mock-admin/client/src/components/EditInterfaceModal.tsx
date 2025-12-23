import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, message, Spin } from 'antd';
import { getInterfaceConfig, updateInterface } from '../api/mock';

interface EditInterfaceModalProps {
  visible: boolean;
  apiName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditInterfaceModal({ visible, apiName, onClose, onSuccess }: EditInterfaceModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (visible && apiName) {
      loadConfig();
    }
  }, [visible, apiName]);

  const loadConfig = async () => {
    setFetching(true);
    try {
      const config = await getInterfaceConfig(apiName);
      form.setFieldsValue({
        name: config.name,
        delay: config.delay,
        enabled: config.enabled
      });
    } catch (error: any) {
      message.error(error.message || '加载配置失败');
    } finally {
      setFetching(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      setLoading(true);
      await updateInterface(apiName, values.name, values.delay, values.enabled);
      message.success('接口配置更新成功');
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
      title={`修改接口配置 - ${apiName}`}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={500}
      okText="保存"
      cancelText="取消"
    >
      <Spin spinning={fetching}>
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="接口名称"
            name="name"
            rules={[
              { required: true, message: '请输入接口名称' },
              { pattern: /^[a-zA-Z0-9._/-]+$/, message: '只能包含字母、数字、点、下划线、中划线、斜杠' }
            ]}
            extra="修改后目录名也会同步修改"
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
      </Spin>
    </Modal>
  );
}
