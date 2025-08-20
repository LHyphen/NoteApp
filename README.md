# NoteApp - 桌面笔记应用

## 关于

NoteApp 是一个使用 Wails、Go、React 和 Quill 构建的简单而强大的桌面笔记应用程序。它允许用户创建、编辑和管理富文本笔记，具有自动保存和简洁的用户界面。

## 功能

*   **笔记创建与管理**: 轻松创建、加载和管理您的笔记。
*   **富文本编辑**: 使用集成的 Quill 编辑器进行文本格式化、图片插入等操作。
*   **自动保存**: 您键入的所有更改都会自动保存，无需手动保存按钮。
*   **右键菜单删除**: 通过在笔记列表上单击右键菜单方便地删除笔记。
*   **持久化存储**: 笔记使用 SQLite 本地保存，确保您的数据在会话之间是安全的。

## 技术栈

*   **后端**:
    *   **Go**: 后端逻辑的主要语言。
    *   **Wails**: 用于使用 Go 和 Web 技术构建跨平台桌面应用程序的框架。
    *   **modernc.org/sqlite**: 用于本地数据持久化的 SQLite 驱动程序。
*   **前端**:
    *   **TypeScript**: JavaScript 的类型化超集，用于稳健的前端开发。
    *   **React**: 用于构建用户界面的 JavaScript 库。
    *   **React-Quill**: Quill 富文本编辑器的 React 组件。
    *   **Vite**: 快速的前端构建工具。

## 快速开始

### 先决条件

在开始之前，请确保您已安装以下软件：

*   **Go**: [下载并安装 Go](https://golang.org/doc/install)
*   **Node.js & npm**: [下载并安装 Node.js](https://nodejs.org/en/download/) (包含 npm)
*   **Wails CLI**: 通过运行以下命令安装 Wails CLI：
    ```bash
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
    ```
*   **WebView2 Runtime (Windows)**: 确保您已安装 [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)。

### 安装

1.  **克隆仓库**:
    ```bash
    git clone <repository_url>
    cd NoteApp
    ```
    *（注意：如果您将项目下载为 zip 文件，请解压缩并导航到 `NoteApp` 目录。）*

2.  **安装依赖**:
    使用提供的 `Makefile` 安装 Go 和 Node.js 依赖项：
    ```bash
    make tidy
    ```
    此命令将为后端依赖项运行 `go mod tidy`，为前端依赖项运行 `npm install`。

### 在开发模式下运行

要在具有前端更改热重载的开发模式下运行应用程序：

```bash
make dev
```
这将打开桌面应用程序窗口。前端更改将立即反映出来。您还可以在浏览器中访问 `http://localhost:5173/` 的前端开发服务器和 `http://localhost:34115` 的 Wails 开发服务器（请检查您的终端输出以获取确切的 URL）。

### 构建生产版本

要构建可再发行的、生产就绪的可执行文件：

```bash
make build
```
可执行文件将生成在 `build/bin` 目录中（例如，在 Windows 上为 `build/bin/NoteApp.exe`）。

### 运行已构建的应用程序

构建后，您可以直接运行可执行文件：

```bash
make run
```
*（此命令特定于 Windows，并假定可执行文件是 `build/bin` 中的 `NoteApp.exe`）*

### 清理项目

要删除构建产物和 `node_modules`：

```bash
make clean
```

## 使用方法

1.  **创建新笔记**: 单击侧边栏中的“+ 新建笔记”按钮。
2.  **编辑笔记**: 在输入字段中键入您的标题，并使用富文本编辑器输入内容。所有更改都会自动保存。
3.  **选择笔记**: 单击侧边栏中的笔记以在编辑器中加载它。
4.  **删除笔记**: 在侧边栏中的笔记上单击右键，然后从上下文菜单中选择“删除”。在出现提示时确认删除。

---