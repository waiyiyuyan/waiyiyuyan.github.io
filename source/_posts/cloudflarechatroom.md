---
title: 用 Cloudflare Workers + Durable Objects 搭建一个极简 Web 文本聊天室
description: 本文介绍如何使用 Cloudflare Workers 与 Durable Objects 搭建一个极简 Web 文本聊天室，基于 WebSocket 实现低延迟通信，无需传统服务器运维，适合小团队、私密交流或技术实验项目。
date: 2025-12-08 21:18:59
tags: 聊天室
categories: cloudflare
---

想快速搭建一个无需服务器运维、低延迟的极简文本聊天室吗？
相比传统自建服务器方案，Cloudflare Workers 提供了一种真正的无服务（Serverless）架构，非常适合用来实现这种轻量级、稳定且私密的文本即时通信应用。

<!-- more -->
**我们的定位：这是一个为团队或小圈子设计的“极简电报机”——它专注文本即时通讯，舍弃了多媒体和复杂通话功能，以追求极致的简单、稳定和私密性。**

## 🎯 项目设计目标与技术取舍

| 特性 | 定位描述 | 技术优势 |
| :--- | :--- | :--- |
| **功能范围** | **纯文本**即时消息。**不支持**图片、视频、文件传输、语音或视频通话。 | 专注于 WebSocket 文本帧处理，数据量小，延迟最低。 |
| **私密性** | **专属房间**（Dedicated Private Rooms）。房间由用户自行命名，不公开列表。 | Durable Objects 的**单例特性**保证了房间状态的隔离和独立。 |
| **性能** | **全球低延迟**。适用于对响应速度要求高的文本交流场景。 | Workers 运行在 Cloudflare 边缘，靠近全球用户。 |
| **架构** | **真正的无服务**。无需关心服务器扩容和维护。 | 自动处理高并发下的连接和状态管理。 |

-----

## 🛠️ 核心技术重述：极简的秘密

这个“极简电报机”之所以能高效运转，是因为依赖于以下三个核心技术：

1.  **Cloudflare Workers：** 全球调度中心，负责快速调度请求。
2.  **Durable Objects (DO)：** 房间的唯一管理员。每个房间 ID 对应一个唯一的 DO 实例，确保了**私密状态隔离**和**单例广播**。
3.  **WebSockets：** 文本数据的专用通道，只用于传输轻量的 **JSON 格式文本数据**。

-----

## 🏗️ 搭建步骤：部署你的专属电报机

搭建过程比你想象的要简单，我们利用官方提供的工具和模板，事半功倍。

> 本项目基于 Cloudflare 官方 Workers Chat Demo，适合用于学习 Durable Objects 与 WebSocket 的实际用法。


### 步骤 1: 准备环境和工具 💻

在开始之前，你需要准备好以下三个核心工具：**Git**（代码管理）、**Node.js**（运行环境）和 **Wrangler CLI**（部署工具）。

#### A. 安装 Git（版本控制系统）

Git 是我们用来**克隆**官方 Demo 项目仓库的必备工具。

* **官方下载地址：** [**https://git-scm.com/downloads**](https://git-scm.com/downloads)

* **安装方法：** 访问上述官方网站，下载并运行适用于您操作系统的安装程序。
* **验证安装：** 运行 `git --version` 确认版本号。

#### B. 安装 Node.js (推荐 v18+)

Node.js 是运行 Worker 开发工具和 Wrangler CLI 所必需的环境。

* **安装方法：** 访问 **Node.js 官方网站** ([https://nodejs.org/](https://nodejs.org/))，下载并运行适用于您系统的 **LTS (长期支持) 版本**安装程序。安装程序会自带 **npm**（Node.js 包管理器）。
* **验证安装：** 运行 `node -v` 和 `npm -v` 确认版本号。

#### C. 全局安装 Wrangler CLI

**Wrangler** 是 Cloudflare 官方的命令行工具，用于将您的代码部署到 Cloudflare 边缘网络。

```bash
npm install -g wrangler
```

#### D. 认证 Wrangler

运行以下命令，并在浏览器中完成授权，以便 Wrangler 可以部署您的项目：

```bash
npx wrangler login
```

-----

### 步骤 2: 获取并配置项目代码

使用 Git 克隆 Cloudflare 官方的 Demo 项目，并进入项目目录安装依赖：
其实我自己魔改了一个 demo 支持发图片 [项目地址](https://github.com/waiyiyuyan/my-workers-chat-demo)

```bash
git clone https://github.com/cloudflare/workers-chat-demo.git
cd workers-chat-demo
npm install
```
如果在国内环境下克隆仓库失败，可以临时为 Git 配置 HTTP 代理，例如：

```bash
git config --global http.proxy http://127.0.0.1:10808
```
#### 配置示例：`wrangler.toml` 🔑

这是项目的默认配置文件，它**确保 Durable Object 绑定正确**，是我们实现聊天室功能的基础。

```toml
name = "edge-chat-demo"
compatibility_date = "2024-01-01"

main = "src/chat.mjs"

[durable_objects]
bindings = [
  { name = "rooms", class_name = "ChatRoom" },
  { name = "limiters", class_name = "RateLimiter" },
]

[[rules]]
type = "Data"
globs = ["**/*.html"]
fallthrough = false

# Indicate that you want the ChatRoom and RateLimiter classes to be callable as Durable Objects.
[[migrations]]
tag = "v1"                                          # Should be unique for each entry
new_sqlite_classes = ["ChatRoom", "RateLimiter"]
```

**配置解析：**

1.  **`main = "src/chat.mjs"`:** 指定 Workers 的入口代码文件。
2.  **`[durable_objects].bindings`:** 关键部分！它将 Worker 代码中的变量名（如 `rooms`）与实际的 Durable Object 类名（如 `ChatRoom`）关联起来。
3.  **`[[migrations]]`:** 确保 `ChatRoom` 和 `RateLimiter` 在 Cloudflare 平台被正确注册为持久化对象，拥有独立的存储命名空间。

-----

### 步骤 3: 核心代码逻辑（房主的工作流程）

您的 Worker 代码接收请求，并根据房间 ID，找到对应的 **`ChatRoom` Durable Object 实例**（房主）。

  * **房主的工作流程：**
    1.  **连接处理：** 房主接收 Worker 转发来的 WebSocket 连接。
    2.  **维护列表：** 房主将这个 WebSocket 对象存入一个内部的连接列表。
    3.  **消息广播：** 房主收到任何文本消息后，会**遍历**列表，将消息即时发送给房间内的所有其他客户端。

-----

### 步骤 4: 部署上线
在部署到 Cloudflare 的全球网络之前，使用 wrangler dev 命令在本地进行实时测试和调试是至关重要的一步。

wrangler dev 会启动一个本地服务器，模拟 Worker 环境运行您的代码：

```bash
npx wrangler dev
```

一切就绪后，只需一行命令，您的**极简文本聊天室**就会被发布到 Cloudflare 的全球网络上：

```bash
npx wrangler deploy
```

部署完成后，你将获得一个 URL。访问它，你和你的伙伴就可以开始使用这个极简、高效且私密的文本聊天室了！