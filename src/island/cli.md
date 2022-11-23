

# 搭建 CLI 脚手架、Dev Server 

最近逛掘金看到个实现类 VitePress 框架的课程，准备跟着学一下。

## CLI 脚手架搭建

我使用社区新秀`CAC`，优点是轻量、使用方便，整体的包体积只有不到 10 KB，没有任何第三方依赖。

```typescript
pnpm i cac -S
```

```typescript
import cac from "cac";
const version = require("../../package.json").version;

const cli = cac("island").version(version).help();

cli
  .command("[root]", "start dev server")
  .alias("dev")
  .action(async (root: string) => {
    console.log("dev", root);
  });

cli
  .command("build [root]", "build for production")
  .action(async (root: string) => {
    console.log("build", root);
  });

cli.parse();

```

为了使 cli 命令能够生效，我们还需要在 package.json 中注册 cli 命令

```json
// package.json
{
  "bin": {
    "island": "bin/island.js"
  }
}
```

同时 package.json 中添加对应的 script 来编译 ts 代码:

```JSON
{
  "scripts": {
    "start": "tsc -w"
  }
}
```

新建对应 bin 文件，这里`#!/usr/bin/env node`一定要加上，否则无法执行。

```javascript
#!/usr/bin/env node
require("../dist/node/cli.js");
```



接着执行 `pnpm start` `npm link` 就可以将 island 命令 link 到全局，这样我们执行 `island dev xxx`就能被正确识别了。

## Dev Server 开发

首先，Dev Server 本质上是一个开发阶段使用的 HTTP Server，它主要包含如下的作用:

- 对资源进行编译，然后将编译产物返回给浏览器
- 实现模块热更新，在文件改动时能推送更新到浏览器
- 静态资源服务，比如支持访问图片等静态资源

我们创建一个 vite dev 的服务

```typescript
export async function createDevServer(root = process.cwd()) {
  return createViteDevServer({
    root,
  });
}
```

调用

```typescript
import { createDevServer } from "./dev"; 
import * as path from 'path';

cli
  .command("[root]", "start dev server")
  .alias("dev")
  .action(async (root: string) => {
    // 添加以下逻辑
    root = root ? path.resolve(root) : process.cwd();
    const server = await createDevServer(root);
    await server.listen();
    server.printUrls();
  });
```

此时执行 `island dev docs`，如果你在 docs 目录下建立 md 文件的话，你就能通过在浏览器后缀添加 `xxx.md` 正确访问了（记得先编译），

<img src="https://cdn.jsdelivr.net/gh/suemor233/static@main/img/image-20221124000532355.png" alt="image-20221124000532355" style="zoom:50%;" />
