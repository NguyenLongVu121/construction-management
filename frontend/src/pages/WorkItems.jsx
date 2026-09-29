import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, message, Spin } from "antd";
import { useSearchParams } from "react-router-dom";
import WorkItemTree from "../components/WorkItemTree";
import { createWorkItem, deleteWorkItem, listWorkItems, updateWorkItem } from "../services/workItemApi";
import "../styles/WorkItems.css";

export default function WorkItems() {
    const [searchParams] = useSearchParams();
    const projectId = Number(searchParams.get("projectId") || 1);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [parentId, setParentId] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        let active = true;
        listWorkItems(projectId)
            .then((nextItems) => {
                if (active) {
                    setItems(nextItems);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (active) {
                    setError(requestError.response?.data?.message || "Không thể tải cây hạng mục");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [projectId]);

    const save = async (itemId, values) => {
        try {
            if (itemId) await updateWorkItem(projectId, itemId, values);
            else await createWorkItem(projectId, { ...values, parentId });
            setParentId(null);
            form.resetFields();
            setItems(await listWorkItems(projectId));
        } catch (requestError) {
            message.error(requestError.response?.data?.message || "Không thể lưu hạng mục");
        }
    };

    const remove = async (item) => {
        try {
            await deleteWorkItem(projectId, item.id);
            setItems(await listWorkItems(projectId));
        } catch (requestError) {
            message.error(requestError.response?.data?.message || "Không thể xóa hạng mục");
        }
    };

    return (
        <main className="work-items-page">
            <Card className="work-items-panel" title="Cây hạng mục">
                <p className="work-items-meta">Dự án #{projectId}</p>
                <Button type="primary" onClick={() => setParentId(null)}>Thêm hạng mục gốc</Button>
                {parentId !== null && <span className="work-items-meta">Đang thêm hạng mục con</span>}
                <Form form={form} layout="inline" onFinish={(values) => save(null, values)}>
                    <Form.Item name="title" rules={[{ required: true, message: "Nhập tên hạng mục" }]}>
                        <Input placeholder="Tên hạng mục mới" />
                    </Form.Item>
                    <Button htmlType="submit">Tạo</Button>
                </Form>
                {error && <Alert type="error" message={error} />}
                {loading ? <Spin /> : <WorkItemTree items={items} onSave={save} onDelete={remove}
                    onAdd={(id) => setParentId(id)} />}
            </Card>
        </main>
    );
}
