# 主题组件渲染实现

这节开始编写和渲染主题组件

## 入口 HTML 处理

新建 HTML 的模板，在项目根目录新建`template.html`文件：

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>

<body>
  <div id="root">123</div>
</body>

</html>
```

现在这个 html 是独立存在的，我们应该要让 Vite 进行响应，此时我们需要编写一个 Vite 插件。

### vite 插件编写

```typescript
import { readFile } from "fs/promises";
import { Plugin } from "vite";
import { DEFAULT_HTML_PATH } from "../constants";

export function pluginIndexHtml(): Plugin {
  return {
    name: "island:index-html",
    apply: "serve",
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          let html = await readFile(DEFAULT_HTML_PATH, "utf-8");

          try {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            res.end(html);
          } catch (e) {
            return next(e);
          }
        });
      };
    },
  };
}
```

我们在 constants 文件夹里管理相关的 path

```typescript
import { join } from "path";

export const PACKAGE_ROOT = join(__dirname, "..", "..", "..");

export const DEFAULT_HTML_PATH = join(PACKAGE_ROOT, "template.html");
```

在 vite 里引入这个插件

```typescript
import { createServer } from "vite";
import { pluginIndexHtml } from "./plugin-island/indexHtml";

export function createDevServer(root: string) {
  return createServer({
    root,
	  plugins: [pluginIndexHtml()],
  });
}
```

我们` tsc` 编译一下，`island dev`即可看到 html 内容，但此时我们并不能像 vite 官方cli 一样有热更新功能，这个我们等下完善。

下面我们开始 react 组件的编写

## 初始化主题组件

::: warning
这里建议把 vite 版本锁定为 3.2.1 或者加上官方的 react 插件 @vitejs/plugin-react ，不然会报错 React is not defined ,因为 jsx: "react-jsx" 参数配置在 tsconfig.json 里面，vite 在 3.2.1 之后内部不再读取这个参数，导致 jsx 语法编译出现问题
:::

安装 react 和 react-dom 这两个必要的依赖：

```bash
pnpm i react react-dom -S
```



```typescript
import { createRoot } from "react-dom/client";
import { App } from "./App";

function renderInBrowser() {
  const containerEl = document.getElementById("root");
  if (!containerEl) {
    throw new Error("#root element not found");
  }
  createRoot(containerEl).render(<App />);
}

renderInBrowser();
```

然后在 App 里自己编写点内容

接着在 `template.html` 中添加浏览器端的入口 script：

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Island.js</title>
</head>

<body>
  <div id="root"></div>
  <script type="module" src="/src/runtime/client-entry.tsx"></script>
</body>

</html>
```

然后在 `tsconfig.json` 中添加这样一行配置：

```diff
{
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "target": "ESNext",
+    "jsx": "react-jsx"
  }
}
```

island dev ，我们就能看到 react 对于的页面了

## 接入热更新

继续编写之前的 vite 插件，实现 HMR

```typescript
import { readFile } from "fs/promises";
import { Plugin } from "vite";
import {  DEFAULT_HTML_PATH } from "../constants";

export function pluginIndexHtml(): Plugin {
  return {
    name: "island:index-html",
    apply: "serve",
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          let html = await readFile(DEFAULT_HTML_PATH, "utf-8");

          try {
             html = await server.transformIndexHtml(
             req.url,
             html,
               req.originalUrl
             );
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            res.end(html);
          } catch (e) {
            return next(e);
          }
        });
      };
    },
  };
}
```

此时我们就有和官方 cli 一样拥有热更新了

当前的 HTML 中客户端的脚本是通过我们手动添加 script 标签的方式实现的，我们要让 Vite 自动加入，因此在 `indexHtml` 插件中添加`transformIndexHtml`钩子，实现过程如下：

```typescript
import { readFile } from "fs/promises";
import { Plugin } from "vite";
import {  CLIENT_ENTRY_PATH, DEFAULT_HTML_PATH } from "../constants";

export function pluginIndexHtml(): Plugin {
  return {
    name: "island:index-html",
    apply: "serve",
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              type: "module",
              src: `/@fs/${CLIENT_ENTRY_PATH}`,
            },
            injectTo: "body",
          },
        ],
      };
    },
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          let html = await readFile(DEFAULT_HTML_PATH, "utf-8");

          try {
            html = await server.transformIndexHtml(
              req.url,
               html,
               req.originalUrl
             );
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            res.end(html);
          } catch (e) {
            return next(e);
          }
        });
      };
    },
  };
}
```

```typescript
export const CLIENT_ENTRY_PATH = join(
  PACKAGE_ROOT,
  "src",
  "runtime",
  "client-entry.tsx"
);
```

接着删除 script 标签，依旧可以访问。
