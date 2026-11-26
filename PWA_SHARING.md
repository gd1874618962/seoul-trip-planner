# PWA、多行程与分享说明

## 当前架构

```text
React + Vite 单页应用
  ├─ 默认旅行：首尔 / 吉隆坡
  ├─ 自定义旅行：localStorage 注册表 + 独立 tripId 数据命名空间
  ├─ 本地离线：localStorage + service worker 缓存
  ├─ 可选云同步：Supabase REST（按 tripId 读写）
  └─ 单份分享：URL 片段中的压缩只读快照
```

不引入新的收费服务。PWA、离线缓存、自定义旅行和链接分享都运行在当前静态网站内；Supabase 仍是可选云同步后端，是否启用取决于部署配置或设备上的手动配置。

## PWA

- `public/manifest.webmanifest`：应用名称、主题色、独立窗口和图标。
- `public/sw.js`：缓存应用外壳、图片和已访问过的 OpenStreetMap 地图瓦片。
- `public/icons/`：192、512、maskable 图标和 Apple Touch Icon。
- `public/splash/`：常见 iPhone 尺寸启动图。
- 生产构建注册 service worker；开发模式不注册，避免缓存干扰开发。

离线范围：

- 可离线打开已经访问过一次的应用。
- 可离线查看行程、地点、提醒、攻略和已缓存图片。
- 未加载过的地图区域可能空白；地图瓦片需要至少联网访问一次。
- 分享链接需要先成功打开一次，之后才能依赖应用离线缓存再次查看。

## 多份旅行计划

- 首页展示全部旅行计划。
- 可新建自定义旅行，填写名称、城市、国家、日期、主题和封面。
- 自定义旅行使用独立 `tripId` 和独立 localStorage 键。
- 首尔、吉隆坡的原有默认攻略和旧存储键保持不变。
- 自定义旅行当前是“本设备优先”。更换设备时，完整自定义旅行目录不会自动迁移；分享链接可用于把单份攻略发给其他设备。

## 单份旅行分享

分享流程：

1. 打开某一份旅行计划。
2. 点击“分享这份旅行”。
3. 复制链接或调用手机系统分享。
4. 朋友直接打开链接，无需安装 App，也无需注册。

分享链接保存的是生成时的一份只读快照，包含：

- 旅行名称、日期、封面；
- 航班和酒店；
- 每日行程、地点和路线；
- 餐厅、咖啡与推荐菜；
- 提醒清单。

不会包含：

- 预算和账本；
- 代购订单；
- Supabase 配置；
- 其他旅行计划。

### 公开访问说明

分享链接属于公开访问：任何拿到完整链接的人都能查看其中的这一份攻略。它不依赖登录，也没有“仅指定朋友可看”的权限控制。

“链接很长”或“别人猜不到”不等于真正的隐私保护。分享前应确认行程中没有不想公开的信息。链接是静态快照，原计划后续修改不会自动同步到旧链接，也无法远程撤销；需要更新时重新生成并发送新链接。

## 公网双端同步

当前同步仍使用 Supabase 的 publishable / anon key。这个 key 是浏览器公开密钥，不是账户密码，不能用来实现“输入密码才能看”。

如果你还没有可用的 Supabase 项目：

1. 登录 `https://supabase.com/dashboard`，创建一个免费项目。
2. 打开 SQL Editor，执行项目里的 `supabase/schema.sql`。
3. 在 Project Settings → API 中取得 Project URL 和 publishable / anon key。
4. 把这两项写入 `.env.local` 后重新部署，或者在两台设备上进入“编辑旅行资料 → 云同步”填写同一组配置。

不要把数据库密码、service_role key 或账户登录密码填进网页。网页只需要 Project URL 和 publishable / anon key。

公网构建推荐把配置注入构建环境：

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

构建命令会自动读取 `.env.local`：

```powershell
Copy-Item .env.example .env.local
# 编辑 .env.local 填入真实 Project URL 和 publishable / anon key
npm run build
```

如果没有在构建环境注入，也可以在两台设备上分别进入“编辑旅行资料 → 云同步”，填写同一组 URL 和 key，然后点击“保存并立即同步”。设备首次建立云记录时会上传当前数据；之后按 `updated_at` 执行 last-write-wins 同步。

常见问题：

- 手机显示“离线模式”：当前浏览器没有云配置，或部署环境没有注入变量。
- 手机显示“同步失败”：检查 Supabase 表是否已执行 `supabase/schema.sql`、匿名访问策略是否允许读写，以及网络是否能访问 Supabase。
- 只有链接没有配置：链接分享仍可工作，但不会产生跨设备实时同步。
- 两台设备同时编辑：当前采用最后保存覆盖，不是多人实时合并。

## 当前安全边界

`supabase/schema.sql` 中的示例策略允许匿名读写所有旅行表，适合单用户、自己使用的第一阶段，不适合把 Supabase 当成多人私密权限系统。

在接入真正隐私保护前，不要把敏感证件、支付信息或私人账本写进公开分享链接。

## 后续升级架构

第二阶段可在不重写页面数据模型的前提下增加：

1. Supabase Auth 登录。
2. `trips.owner_id` 与 `trip_members` 权限表。
3. 基于 `auth.uid()` 的 RLS：只有所有者或被邀请成员可读写。
4. `share_links` 表：每份分享使用随机 token、可选过期时间和撤销状态。
5. “重新生成链接”和“停止分享”。
6. 多人共同编辑与实时同步可继续使用 Supabase Realtime，不需要改动现有页面 getter 接口。

## 验证命令

```bash
npm run build
npm run audit:design
npm run verify:guide
npm run verify:pwa
npm run verify:cloud
```

`verify:pwa` 覆盖 PWA 元数据、固定底栏、路线颜色与顺序、自定义旅行、公开分享、只读边界、离线重载和桌面/手机横向溢出。`verify:cloud` 使用两个独立浏览器会话模拟跨设备同步。
