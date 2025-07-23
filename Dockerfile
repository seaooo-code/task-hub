FROM oven/bun:latest AS base

# 设置工作目录
WORKDIR /app

# 复制包管理文件
COPY package.json bun.lock ./

# 安装依赖
RUN bun install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN bun run build

# 生产阶段
FROM oven/bun:latest AS production

WORKDIR /app

# 复制package.json和bun.lock
COPY package.json bun.lock ./

# 只安装生产依赖
RUN bun install --frozen-lockfile --production

# 从构建阶段复制构建产物
COPY --from=base /app/dist ./dist

# 复制其他必要文件
COPY --from=base /app/drizzle ./drizzle

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# 更改文件所有权
RUN chown -R nestjs:nodejs /app
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun --version || exit 1

# 启动应用
CMD ["bun", "run", "start:prod"]