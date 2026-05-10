# WhatsApp Automation for Shopify - Product Requirements Document

Status: completed

---

## Problem Statement

Shopify 中小独立站卖家面临弃单挽回效率低下的问题。现有邮件弃单挽回平均打开率仅 15%，大量潜在收入流失。WhatsApp 作为高打开率（90%+）的渠道，卖家想要利用但面临以下障碍：

1. WhatsApp Business API 接入门槛高，需要 Meta 审核、服务器配置、Webhook 管理
2. 消息模板需要单独审核，流程复杂
3. 缺乏与 Shopify 的无缝集成，无法基于店铺事件自动触发消息
4. 合规要求高，需明确获取用户授权，否则面临封号和法律风险
5. 现有解决方案（如 ManyChat）主要面向英文市场，中文支持差、定价不透明

卖家需要一个低门槛、即开即用、能直观体现 ROI 的 WhatsApp 自动化营销工具。

---

## Solution

为 Shopify 独立站提供一键安装的 WhatsApp 自动化应用，核心价值主张：

- **即开即用**：预审核的消息模板，无需等待 Meta 审核
- **无缝集成**：深度对接 Shopify Webhook，自动响应店铺事件
- **合规保障**：内置用户授权收集机制，符合 GDPR 和 Meta 政策
- **ROI 可量化**：实时展示挽回订单数和金额，让卖家看到直接收益
- **渐进收费**：早期免费测试获取用户，后期按价值分档订阅

MVP 阶段聚焦弃单挽回和订单确认两个最高价值场景，快速验证产品市场契合度。

---

## User Stories

### 安装与配置
1. 作为 Shopify 卖家，我想要一键安装 WhatsApp 自动化应用，以便快速开始使用
2. 作为卖家，我想要在应用内配置我的 Twilio 账号信息，以便发送 WhatsApp 消息
3. 作为卖家，我想要在结账页面添加 WhatsApp 授权复选框，以便合规收集用户同意
4. 作为卖家，我想要预览消息模板内容，以便了解客户会收到什么

### 弃单挽回
5. 作为卖家，我想要当客户加购但未结账时，自动在 30 分钟后发送 WhatsApp 提醒
6. 作为卖家，我想要消息包含直达购物车的链接，以便客户一键完成购买
7. 作为卖家，我想要追踪哪些弃单通过 WhatsApp 被成功挽回，以便计算 ROI
8. 作为卖家，我想要设置弃单挽回的开关，以便在促销期间暂停发送

### 订单确认
9. 作为卖家，我想要当客户完成订单后，自动发送 WhatsApp 确认消息
10. 作为卖家，我想要确认消息包含订单号和追踪链接，以便客户查询物流
11. 作为卖家，我想要订单确认和弃单挽回不会重复发送给同一客户

### 数据与分析
12. 作为卖家，我想要查看本月已发送的消息数量和剩余额度，以便管理使用
13. 作为卖家，我想要查看消息送达率和失败原因，以便排查问题
14. 作为卖家，我想要查看 WhatsApp 消息的点击率，以便评估内容吸引力
15. 作为卖家，我想要查看通过 WhatsApp 挽回的弃单数量和总收入，以便评估应用价值

### 合规与风控
16. 作为卖家，我想要系统只向已明确授权的用户发送消息，以避免违规风险
17. 作为卖家，我想要系统验证手机号是否注册了 WhatsApp，以避免发送失败
18. 作为卖家，我想要对于高风险店铺进行审核，以防止滥用影响通道质量

### 免费与付费
19. 作为早期测试用户，我想要免费使用基础功能，以便验证产品价值
20. 作为卖家，当我的业务量增长时，我想要升级到付费套餐以解锁更多额度

---

## Implementation Decisions

### 技术栈
- **框架**：Remix + Shopify App Bridge（官方推荐，生态成熟）
- **数据库**：Prisma + PlanetScale（Serverless MySQL，与 Remix 生态配合好）
- **调度引擎**：Inngest 或 Trigger.dev（处理延迟任务和重试逻辑）
- **消息通道**：Twilio WhatsApp API（快速接入，无需等待 Meta 审核）

### 架构模块

#### 1. OAuth & 店铺管理模块
- 处理 Shopify 的 OAuth 授权流程
- 存储店铺配置（Twilio 账号、开关设置）
- 店铺状态管理（新店铺审核、激活、暂停）

#### 2. Webhook 接收与解析模块
- 接收 Shopify `checkout` Webhook（弃单事件）
- 接收 Shopify `order` Webhook（订单创建事件）
- 事件数据标准化，提取关键信息（客户手机号、订单金额、购物车内容）

#### 3. 合规与授权模块
- 检查用户是否在结账时勾选 WhatsApp 授权
- 维护授权记录表（用户手机号、授权时间、店铺 ID）
- 提供撤销授权的接口

#### 4. 调度引擎模块（核心深模块）
```typescript
// 关键接口设计
interface DelayedTaskScheduler {
  // 延迟调度任务，支持幂等性检查
  schedule(task: Task, delay: Duration, idempotencyKey: string): Promise<TaskId>;
  // 取消未执行的任务
  cancel(taskId: TaskId): Promise<void>;
  // 查询任务状态
  getStatus(taskId: TaskId): Promise<TaskStatus>;
}

// 弃单挽回调度示例
// 收到 checkout webhook -> 调度 30 分钟后检查任务
// 任务执行时：检查订单是否已创建 -> 未创建则发送 WhatsApp
```

#### 5. 消息模板引擎模块
- 预定义模板注册表（弃单挽回、订单确认）
- 模板变量替换（{{1}} = 客户名，{{2}} = 链接）
- 多语言模板选择（基于店铺主语言）
- 模板版本管理

#### 6. 消息发送模块
- 调用 Twilio API 发送 WhatsApp 消息
- 消息发送日志记录（发送时间、状态、失败原因）
- 限流控制（避免触发 Twilio 速率限制）
- 失败重试机制

#### 7. 归因与分析模块
- 链接追踪参数生成（UTM 或自定义参数）
- 点击事件记录（通过重定向服务）
- 订单关联分析（识别通过 WhatsApp 挽回的订单）
- 每日汇总统计

#### 8. 商户后台 UI 模块
- 配置页面（Twilio 设置、开关控制）
- 数据看板（发送量、送达率、点击率、挽回收入）
- 消息历史查询

### 数据库 Schema 核心表

```prisma
// 店铺配置
model Shop {
  id              String   @id
  domain          String   @unique
  twilioAccountSid String?
  twilioAuthToken  String?  // 加密存储
  isActive        Boolean  @default(false)
  createdAt       DateTime @default(now())
}

// 用户授权记录
model CustomerConsent {
  id          String   @id @default(cuid())
  shopId      String
  phoneNumber String
  consentedAt DateTime @default(now())
  revokedAt   DateTime?
  
  @@unique([shopId, phoneNumber])
}

// 弃单事件
model AbandonedCheckout {
  id            String   @id
  shopId        String
  checkoutToken String
  customerPhone String?
  totalPrice    Decimal
  scheduledTaskId String? // 关联调度任务
  recoveredAt   DateTime?
  createdAt     DateTime @default(now())
}

// 消息发送记录
model MessageLog {
  id          String   @id @default(cuid())
  shopId      String
  type        MessageType // ABANDONED_CART | ORDER_CONFIRMATION
  phoneNumber String
  templateId  String
  status      MessageStatus // PENDING | SENT | DELIVERED | FAILED
  twilioSid   String?
  sentAt      DateTime?
  deliveredAt DateTime?
  failedReason String?
  trackingUrl String?
  clickCount  Int      @default(0)
}

// 订单归因
model OrderAttribution {
  id          String   @id @default(cuid())
  shopId      String
  orderId     String   @unique
  messageLogId String // 关联触发转化的消息
  attributedRevenue Decimal
  attributedAt DateTime @default(now())
}
```

### API 契约

**Shopify Webhook 接收端点**：
```
POST /webhook/shopify/checkout
POST /webhook/shopify/order
```
- 验证 Shopify HMAC 签名
- 幂等性处理（基于 `X-Shopify-Checkout-Id` 等唯一标识）

**消息点击追踪端点**：
```
GET /track/:trackingId
```
- 记录点击事件
- 302 重定向到目标链接

### 关键业务流程

**弃单挽回流程**：
1. Shopify 发送 `checkout` Webhook（用户创建结账但未完成）
2. 系统检查：手机号存在 + 已授权 + 未超过免费额度
3. 调用调度引擎，注册 30 分钟后的检查任务
4. 30 分钟后任务执行：
   - 查询 Shopify API：该 checkout 是否已转为订单
   - 未转化：组装消息模板，调用 Twilio 发送
   - 已转化：取消任务
5. 记录消息日志，生成追踪链接
6. 客户点击链接 -> 记录点击 -> 重定向到购物车
7. 客户完成订单 -> Shopify `order` Webhook -> 标记弃单已挽回

**订单确认流程**：
1. Shopify 发送 `order` Webhook
2. 系统检查：手机号存在 + 已授权
3. 立即组装订单确认模板
4. 调用 Twilio 发送
5. 记录消息日志

### 安全与合规
- Twilio 凭证加密存储（使用 Prisma 的加密扩展或环境变量 + 应用层加密）
- 所有手机号脱敏展示（后 4 位隐藏）
- Webhook 签名验证防止伪造
- 用户授权撤销即时生效

---

## Testing Decisions

### 测试策略
- **单元测试**：核心业务逻辑（调度、模板渲染、归因计算）
- **集成测试**：Webhook 接收、Twilio API 调用、数据库操作
- **E2E 测试**：完整的弃单挽回流程（模拟 Shopify Webhook -> 验证消息发送）

### 重点测试模块
1. **调度引擎模块**：
   - 测试延迟任务的准时触发
   - 测试幂等性（同一 checkout 不会创建重复任务）
   - 测试任务取消逻辑

2. **合规模块**：
   - 测试未授权用户不会收到消息
   - 测试授权撤销后的即时生效

3. **归因模块**：
   - 测试点击追踪的准确性
   - 测试订单与消息的关联逻辑

### 测试数据
- 使用 Shopify 提供的测试店铺和 Webhook 示例
- 使用 Twilio Test Credentials 进行消息发送测试（不产生真实费用）

---

## Out of Scope

MVP 阶段明确不包含以下内容：

1. **物流通知**：需要集成第三方物流 API（ShipStation/17track），复杂度较高
2. **到货提醒**：需要库存监控和订阅管理系统
3. **复购提醒**：需要定时任务调度和优惠券生成
4. **自定义消息模板**：用户无法编辑模板内容，仅使用预审核模板
5. **多语言自动翻译**：模板提供预翻译版本，不做实时翻译
6. **WhatsApp 回复管理**：仅单向发送消息，不处理客户回复
7. **A/B 测试**：消息模板固定，不做版本对比
8. **短信 (SMS) 通道**：仅支持 WhatsApp
9. **邮件通道**：不与邮件弃单挽回竞争，专注 WhatsApp
10. **批量导入/导出**：仅支持 Shopify 原生数据流

以上内容将在 Phase 2 根据客户反馈逐步添加。

---

## Further Notes

### 商业约束
- 免费测试阶段限制：每个店铺每月 200 条消息，仅弃单挽回和订单确认功能
- 免费期截止：2025 Q3 或 50 个活跃店铺（先到为准）
- 付费套餐定价：Starter $19/月（500条）、Growth $49/月（2000条）、Pro $99/月（不限量）

### 风险评估
- **通道被封风险**：通过严格的用户授权验证和防滥用机制降低
- **Twilio 成本风险**：免费期需监控总发送量，设置成本上限预警
- **Meta 政策变更**：关注 WhatsApp Business Policy 更新，预留模板调整空间

### 成功指标
- 安装转化率：Shopify App Store 访问到安装的比例 > 5%
- 激活率：安装后完成 Twilio 配置的店铺比例 > 50%
- 消息送达率：发送成功的消息比例 > 85%
- 弃单挽回率：通过 WhatsApp 挽回的弃单比例 > 8%
- NPS 评分：早期用户满意度 > 40
