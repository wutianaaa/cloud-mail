# All Email Pickup API

这些接口基于 `allEmail` 邮件筛选能力实现，不使用账户功能。

请求地址经过 Worker 入口时需要带 `/api` 前缀；Hono 内部路由为 `/allEmail/...`。

## 认证方式

这两个取件接口支持两种认证方式：

- 原有登录态认证：请求头 `Authorization: <JWT>`。
- API Key 认证：请求头 `X-API-Key: <apiKey>`。

API Key 在前端“邮件取件”页面设置。也兼容 query 参数 `apiKey`，但外部调用建议使用请求头，避免密钥出现在日志或浏览器地址栏中。

```bash
curl -H "X-API-Key: your-api-key" \
  "https://your-domain.com/api/allEmail/list/messages?email=user@example.com&n=3"
```

## 获取指定邮箱最近邮件

```http
GET /api/allEmail/list/messages?email=user@example.com&n=3&sendEmail=sender@example.com
```

### Query 参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `email` | 是 | 指定收件邮箱。也兼容 `toEmail`。 |
| `n` | 否 | 返回最近邮件条数，默认 `1`，最大 `50`。 |
| `sendEmail` | 否 | 指定发件人邮箱。也兼容 `fromEmail`、`sender`。 |

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "emailId": 123,
      "sendEmail": "sender@example.com",
      "sendName": "Sender",
      "subject": "Verify your account",
      "toEmail": "user@example.com",
      "toName": "user",
      "type": 0,
      "status": 0,
      "code": "123456",
      "createTime": "2026-06-02 10:00:00",
      "content": "<p>...</p>",
      "text": "Your code is 123456",
      "isDel": 0
    }
  ]
}
```

## 获取指定邮箱最后一条邮件验证码

```http
GET /api/allEmail/latest/code?email=user@example.com&sendEmail=sender@example.com
```

使用 API Key：

```bash
curl -H "X-API-Key: your-api-key" \
  "https://your-domain.com/api/allEmail/latest/code?email=user@example.com&sendEmail=sender@example.com"
```

### Query 参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `email` | 是 | 指定收件邮箱。也兼容 `toEmail`。 |
| `sendEmail` | 否 | 指定发件人邮箱。也兼容 `fromEmail`、`sender`。 |

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "emailId": 123,
    "sendEmail": "sender@example.com",
    "subject": "Verify your account",
    "toEmail": "user@example.com",
    "code": "123456",
    "createTime": "2026-06-02 10:00:00"
  }
}
```

如果没有找到邮件，或最后一条邮件没有识别出验证码，`data.code` 为空字符串。

## 筛选规则

- 只返回收件邮件：`type = RECEIVE`。
- 排除逻辑删除邮件：`isDel = NORMAL`。
- 排除还在保存中的邮件：`status != SAVING`。
- 邮箱和发件人邮箱均为大小写不敏感精确匹配。
