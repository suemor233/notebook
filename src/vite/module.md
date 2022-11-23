# 前端模块化的变迁

 Vite 是目前最高效的构建工具之一，其在开发阶段基于浏览器 ESM 的支持实现了`no-bundle`服务，并且还借助 Esbuild 超快的编译速度来做第三方库构建和 TS/JSX 语法编译，从而能够有效提高开发效率。

在聊 vite 之前我们得先了解前端模块化是如何演进的。

## 文件划分

文件划分方式是最原始的模块化实现，就是我们初学 javascript 时候的引入方式。

这种方式会有变量名冲突问题，并且我们很难知道某个变量到底属于哪些模块

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <script src="./module-a.js"></script>
    <script src="./module-b.js"></script>
     <script>
      console.log(data);
      method();
    </script>
  </body>
</html>


// module-a.js
let data = "data";

// module-b.js
function method() {
  console.log("execute method");
}
```

## 命名空间

这样一来，每个变量都有自己专属的命名空间。

虽然解决了变量到底属于哪些模块的问题，但是变量名冲突问题依旧无法避免

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <script src="./module-a.js"></script>
    <script src="./module-b.js"></script>
    <script>
      console.log(data);
      method();
    </script>
  </body>
</html>

// module-a.js
window.moduleA = {
  data: "moduleA",
  method: function () {
    console.log("execute A's method");
  },
};

// module-b.js
window.moduleB = {
  data: "moduleB",
  method: function () {
    console.log("execute B's method");
  },
};
```

## IIFE(立即执行函数)

利用了闭包的特性，创建一个私有的作用域，挂在到 window 对象上实现暴露

这应该是非标准模块化中，最优雅的方式了，我们依旧可以看到部分老项目仍在使用。

```javascript
(function () {
  let data = "moduleA";

  function method() {
    console.log(data + "execute");
  }

  window.moduleA = {
    method: method,
  };
})();
```

但 script 标签的加载顺序却难以控制，因此我们引出业界主流的三大模块规范 `CommonJS`、`AMD` 和 `ES Module`

## CommonJS 规范

CommonJS 是业界最早正式提出的 JavaScript 模块规范，直到现在我们写 nodejs 时也在大量使用。

```javascript
// module-a.js
const data = "hello world";
function getData() {
  return data;
}
module.exports = {
  getData,
};

// index.js
const { getData } = require("./module-a.js");
console.log(getData());
```

但主要用于服务端，因为它是以同步的方式进行模块加载，用在浏览器会造成浏览器 JS 解析过程的阻塞。

当然, 业界也产生了 [browserify](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fbrowserify%2Fbrowserify) 这种打包工具来支持打包 CommonJS 模块，从而实现在浏览器上执行。

为了解决 CommonJS 不太适合在浏览器中运行，业界便出现了 `AMD`

## AMD 规范

`AMD`全称为`Asynchronous Module Definition`，即异步模块定义规范

```javascript
// main.js
define(["./print"], function (printModule) {
  printModule.print("main");
});

// print.js
define(function () {
  return {
    print: function (msg) {
      console.log("print " + msg);
    },
  };
});
```

但由于没有得到浏览器的原生支持，AMD 规范需要由第三方的 loader 来实现，最经典的就是 [requireJS](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Frequirejs%2Frequirejs) 库了，它完整实现了 AMD 规范，至今仍然有不少项目在使用。

::: tip
你可能也听说过 CMD 规范 和 UMD 规范。CMD 这个规范是由淘宝出品的`SeaJS`实现的，解决的问题和 AMD 一样。而 UMD 是兼容 AMD 和 CommonJS 的一个模块化方案，可以同时运行在浏览器和 Node.js 环境。
:::

## ES6 Module

`ES6 Module` 也被称作 `ES Module`(或 `ESM`)，是官方提出的模块化规范，其在我们前端工程化项目中大量使用，且得到了现代浏览器的内置支持，浏览器会按照 ES Module 规范来进行依赖加载和模块解析。

```javascript
// main.js
import { methodA } from "./module-a.js";
methodA();

//module-a.js
const methodA = () => {
  console.log("a");
};

export { methodA };
```

这也是 Vite 在开发阶段实现 no-bundle 的原因，一个 import 语句即代表了一个 HTTP 请求，从而进行模块的按需加载。

::: tip
这仅限制于你的源代码，并非第三方库的依赖。 因为 Chrome 对同一个域名下只能同时支持  6 个 HTTP 并发请求的限制而且有些非 ESM 的包，第三方库的内容依旧会在依赖的预构建时采用 Esbuild 打包，打包内容会放在`node_modules`中`.vite`目录中，并非完全的 no-bundle
:::

Node.js 中，即使是在 CommonJS 模块里面，也可以通过 `import` 方法顺利加载 ES 模块

```javascript
async function func() {
   // 加载一个 ES 模块
  // 文件名后缀需要是 mjs
  const { a } = await import("./module-a.mjs");
  console.log(a);
}

func();

module.exports = {
  func,
};
```

当然你可以在`package.json`中声明`type: "module"`属性，便会默认以 ES Module 规范去解析模块。
