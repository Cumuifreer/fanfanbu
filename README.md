# 饭饭簿

一个基于同一套菜单数据源的家庭菜单网站，分成两个使用版本：

- 静态展示版：部署到 GitHub Pages，给家里人日常查看菜品、筛选、搜索和随机选菜。
- 本地编辑版：只在本地运行，用最简单的方式维护菜品、菜谱步骤和图片，保存后直接写回仓库里的共享数据文件。

整个项目不依赖数据库，也不依赖登录系统。编辑完成后可以直接在本地编辑版点击“保存并发布”，系统会自动把菜单改动推送到 GitHub，静态站点随后就会同步更新。

## 现在的架构

### 共享数据与资源

- 共享菜单数据文件：`public/data/dishes.json`
- 共享图片资源目录：`public/sample-images/` 和 `public/menu-images/uploads/`
- 静态展示页直接读取 `public/data/dishes.json`
- 本地编辑页通过本地开发服务器提供的轻量文件 API，把修改后的 JSON 和图片写回 `public/` 目录

这意味着：

- 展示页和编辑页永远使用同一套数据
- 不需要维护两套菜单结构
- 编辑后的结果就是最终要提交到 GitHub 的结果

## 数据模型

每道菜至少包含这些字段：

```ts
interface Dish {
  id: string;
  name: string;
  category: 'red' | 'white' | 'set_meal';
  ingredients: string[];
  recipeSteps: string[];
  image: string | null;
  createdAt: string;
  updatedAt: string;
}
```

补充说明：

- `category` 统一由常量管理，支持 `red`、`white`、`set_meal`
- `ingredients` 使用字符串数组，适合直观表单编辑
- `recipeSteps` 使用步骤数组，支持逐条新增、修改、删除和上下顺序调整
- `recipeSteps` 为空时，展示版会显示“暂无菜谱”

## 目录结构

```text
fanfanbu/
├─ .github/
│  └─ workflows/
│     └─ deploy-pages.yml         # GitHub Pages 自动部署 workflow
├─ public/
│  ├─ data/
│  │  └─ dishes.json              # 共享菜单数据
│  ├─ menu-images/
│  │  └─ uploads/                 # 本地编辑版上传后的图片
│  └─ sample-images/              # 默认示例图片
├─ src/
│  ├─ components/                 # 共享展示组件 + 编辑组件
│  ├─ constants/                  # 应用常量、分类枚举、接口路径
│  ├─ lib/                        # 数据转换、随机逻辑、文件 API 客户端
│  ├─ pages/                      # PublicApp / EditorApp 双入口页面
│  ├─ styles/                     # 共享样式系统
│  ├─ types/                      # TypeScript 类型
│  ├─ main.tsx                    # 静态展示版入口
│  └─ editor-main.tsx             # 本地编辑版入口
├─ editor.html                    # 本地编辑版页面入口
├─ index.html                     # 静态展示版页面入口
├─ vite.config.js                 # 唯一生效的 Vite 配置
└─ README.md
```

## 已实现的功能

### 静态展示版

- 首页展示全部菜品
- 分类切换：全部菜品 / 红区 / 白区 / 定食
- 搜索：按菜名、材料、菜谱步骤关键词搜索
- 红区 / 白区随机选菜
- 定食独立展示与管理，默认不参与随机
- 手机和桌面端双端适配
- 中文字体优先的温和卡片式 UI

### 本地编辑版

- 新建菜品
- 修改菜品
- 删除菜品（带确认）
- 上传或替换图片
- 立即预览图片
- 逐条编辑材料
- 逐条编辑菜谱步骤
- 菜谱步骤支持新增、删除、上下顺序调整
- 保存后直接写入 `public/data/dishes.json`
- 删除或替换图片后会自动清理不再使用的上传图片文件
- 主按钮支持“保存并发布”，会自动完成本地保存、`git add`、`git commit`、`git push`
- 如果暂时不想发布，也可以选择“仅保存到本地”

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动静态展示版开发环境

```bash
npm run dev
```

开发服务器现在会默认监听局域网地址，同一 Wi-Fi 下的手机、平板和其他电脑也可以访问。

默认可访问：

- 展示首页：`http://127.0.0.1:5173/` 或终端显示的地址
- 编辑页：`http://127.0.0.1:5173/editor.html`

如果要在手机或平板上打开，请使用你电脑在局域网中的 IP，而不是 `localhost`。例如：

- 展示首页：`http://192.168.1.23:5173/`
- 编辑页：`http://192.168.1.23:5173/editor.html`

其中 `192.168.1.23` 只是示例，实际请以你电脑当前的局域网 IP 为准。

### 3. 直接启动本地编辑版

```bash
npm run editor
```

这个命令会启动同一个本地开发服务器，默认监听局域网地址，并直接打开 `editor.html`。

因此运行后：

- 电脑本机可以继续正常访问
- 同一局域网下的手机也可以通过 `http://电脑局域网IP:5173/editor.html` 访问编辑页

如果局域网里的其他设备仍然打不开，通常不是项目配置问题，而是电脑系统防火墙拦截了 5173 端口；放行后即可访问。

### 4. 使用“保存并发布”

本地编辑版现在已经支持一键发布，普通使用时不需要再回终端手动输入 Git 命令。

点击“保存并发布”后，系统会按这个顺序自动执行：

1. 先把最新菜单数据写入 `public/data/dishes.json`
2. 把新上传或替换后的图片写入 `public/menu-images/uploads/`
3. 自动执行 `git add`
4. 自动生成一条类似 `update menu data 2026-04-15 19:30` 的提交信息
5. 自动执行 `git commit`
6. 自动执行 `git push origin main`
7. 触发 GitHub Actions，随后自动更新 GitHub Pages

补充说明：

- 这个功能依赖这台电脑已经完成 GitHub 认证
- 也就是说，你需要先确保本机的 `git push` 本来就是可用的，例如已经配好 GitHub 登录、SSH key 或 token
- 如果当前没有新的菜单改动，系统不会重复创建 commit，而是直接提示“没有新的内容需要发布”
- 如果本地保存成功但推送失败，界面会明确提示“已经保存到本地，但发布失败”

### 5. 生产构建

```bash
npm run build
```

构建结果输出到 `dist/`，其中会包含：

- `dist/index.html`
- `dist/editor.html`
- `dist/data/dishes.json`
- `dist/sample-images/`
- `dist/menu-images/uploads/`

说明：

- GitHub Pages 日常给家里人访问时只需要用 `index.html`
- `editor.html` 也会被构建出来，但真正的“保存到文件”能力只在本地开发服务器下可用
- GitHub Pages 构建会自动按项目仓库子路径 `/fanfanbu/` 生成正确的静态资源和数据文件路径

## 日常维护流程

推荐每次更新都按这个顺序：

1. 运行 `npm run editor`
2. 在编辑页里新增、修改或删除菜品
3. 如果需要，上传或替换图片
4. 点击“保存并发布”
5. 打开 `http://127.0.0.1:5173/` 检查展示效果和随机选菜
6. 等待 GitHub Actions 自动构建并发布 GitHub Pages

如果你只是想先把内容落到本地、暂时不推到 GitHub，也可以先点“仅保存到本地”，之后再回来点“保存并发布”。

常见会变动的文件是：

- `public/data/dishes.json`
- `public/menu-images/uploads/` 下的新图片

## GitHub Pages 部署

本项目已经配置好 GitHub Actions 自动部署 GitHub Pages。

仓库地址：

- `https://github.com/Cumuifreer/fanfanbu`

自动部署流程：

1. 菜单修改通过编辑页里的“保存并发布”推送到 `main` 分支
2. `.github/workflows/deploy-pages.yml` 自动触发
3. GitHub Actions 安装依赖并执行 `npm run build`
4. workflow 将 `dist/` 上传为 Pages artifact
5. GitHub Pages 自动发布最新静态站点

网站访问地址：

- `https://cumuifreer.github.io/fanfanbu/`

补充说明：

- GitHub Pages 公开发布的是静态展示版首页
- `editor.html` 会随构建一起产出，但它仍然只适合本地开发服务器环境，不属于公开使用流程
- 如果你在 GitHub Pages 上直接打开 `editor.html`，页面会提示应改用本地 `npm run editor`
- 现在日常更新菜单时，不需要再手动回终端执行 `git add`、`git commit`、`git push`
- 如果仓库第一次启用 Pages，而仓库设置里还没有切到 `GitHub Actions`，请在 `Settings -> Pages` 中手动选择一次，之后就会持续自动发布

## 示例数据

项目已经内置示例菜单数据，覆盖：

- 红区
- 白区
- 定食

同时包含：

- 带完整 `recipeSteps` 的菜
- 不带 `recipeSteps` 的菜

这样刚启动项目时就能直接看到完整效果，不是空壳页面。

## 维护建议

- 菜品数据统一只改编辑页，不要手动改 JSON
- 图片尽量使用清晰但体积适中的照片，上传更顺手
- 每次大改后先在本地首页看一遍分类、搜索和随机选菜是否正常
- 如果“保存并发布”失败，先检查本机 GitHub 认证和 `main` 分支状态
