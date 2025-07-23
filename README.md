# Task Hub - 任务管理平台

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
</p>

<p align="center">
  <strong>基于 NestJS 构建的任务管理和调度平台</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Node.js->=18.0.0-green.svg" alt="Node Version" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.7.3-blue.svg" alt="TypeScript Version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome" /></a>
</p>

---

## 📖 项目介绍

Task Hub 是一个基于 NestJS 开发的任务管理和调度平台，集成了飞书API、定时任务调度、用户管理等功能，适用于团队协作和任务管理场景。

### 🎯 设计目标

- **简洁实用**: 直观的功能设计，满足日常任务管理需求
- **稳定可靠**: 基于成熟的技术栈，确保系统稳定运行
- **易于部署**: 支持 Docker 容器化部署
- **开源友好**: 完全开源，方便二次开发和定制

## ✨ 核心功能

### 🚀 任务管理
- **定时任务**: 支持 Cron 表达式的定时任务调度
- **任务监控**: 任务执行状态跟踪和日志记录
- **手动执行**: 支持手动触发任务执行
- **任务模板**: 预定义任务模板，快速创建任务

### 👥 用户管理
- **用户认证**: 基本的用户登录和认证功能
- **用户信息**: 用户基本信息管理
- **操作记录**: 用户操作历史记录

### 🔔 飞书集成
- **消息推送**: 任务状态变化自动推送到飞书
- **群机器人**: 支持飞书群机器人功能
- **基础API**: 集成飞书基础API功能

### 📋 值班管理
- **值班安排**: 创建和管理值班计划
- **值班提醒**: 自动值班提醒功能
- **值班记录**: 值班历史记录查询

## 🏗️ 技术架构

### 核心技术
- **框架**: NestJS 11.x - Node.js 应用框架
- **语言**: TypeScript 5.7 - 类型安全的 JavaScript
- **数据库**: MySQL - 关系型数据库
- **ORM**: Drizzle ORM - TypeScript ORM 工具

### 开发工具
- **代码质量**: ESLint + Prettier
- **数据验证**: class-validator + class-transformer
- **配置管理**: @nestjs/config
- **任务调度**: @nestjs/schedule + cron
- **HTTP 请求**: @nestjs/axios
- **容器化**: Docker

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- bun >= 1.0.0
- MySQL >= 8.0

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/your-username/task-hub.git
cd task-hub
```

#### 2. 安装依赖
```bash
bun install
```

#### 3. 环境配置
复制环境变量配置文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接：
```env
DATABASE_URL=mysql://username:password@localhost:3306/database_name
```

#### 4. 数据库初始化
```bash
# 生成数据库迁移文件
bun run drizzle-kit generate

# 执行数据库迁移
bun run drizzle-kit migrate
```

#### 5. 启动应用

**开发模式**
```bash
bun run start:dev
```

**生产模式**
```bash
# 构建项目
bun run build

# 启动生产服务
bun run start:prod
```

应用将在 `http://localhost:3000` 启动。

### Docker 部署

#### 使用 Docker 快速部署

1. **构建镜像**
```bash
docker build -t task-hub .
```

2. **运行容器**
```bash
docker run -d \
  --name task-hub \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://username:password@host:3306/database" \
  task-hub
```

#### 使用 Docker Compose（推荐）

创建 `docker-compose.yml` 文件：
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://root:password@db:3306/task_hub
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: task_hub
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

启动服务：
```bash
docker-compose up -d
```

### 开发指南

#### 可用脚本

```bash
# 开发模式启动
bun run start:dev

# 调试模式启动
bun run start:debug

# 代码格式化
bun run format

# 代码检查
bun run lint

# 运行测试
bun run test

# 运行测试并生成覆盖率报告
bun run test:cov

# 运行端到端测试
bun run test:e2e
```

#### 项目结构
```
src/
├── app.module.ts          # 应用主模块
├── main.ts               # 应用入口文件
├── common/               # 公共模块
├── drizzle/              # 数据库配置
├── duties/               # 值班管理模块
├── feishu/               # 飞书集成模块
├── tasks/                # 任务管理模块
├── template/             # 模板管理模块
├── thrift/               # Thrift 服务模块
├── users/                # 用户管理模块
└── utils.ts              # 工具函数
```

### 常见问题

#### Q: 数据库连接失败
A: 请检查 `.env` 文件中的 `DATABASE_URL` 配置是否正确，确保 MySQL 服务正在运行。

#### Q: 端口被占用
A: 可以通过环境变量 `PORT` 修改应用端口：
```bash
PORT=3001 bun run start:dev
```

#### Q: bun 命令不存在
A: 请先安装 bun：
```bash
curl -fsSL https://bun.sh/install | bash
```