# React + Vite 搭建一个简单的组件库

## 前言

最近阅读了下 vite 的文档，发现它有个`库模式`用来打包挺方便的，因而写篇博客记录下折腾过程。

## 基本配置

执行如下命令创建一个 React + TypeScript 的项目

```bash
pnpm create vite
```

删除 src 和 public 文件夹，创建 example 和 packages 文件夹，其中 example 存放组件示例或者调试组件，packages 存放组件源码。另外别忘了修改根目录 index.html `script`路径。

```javascript
├── node_modules
├── packages
├── example
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

// index.html
<script type="module" src="/example/main.tsx"></script>
```

> 注：相关 eslint prettier tsconfig 的配置请自行查看末尾 git 仓库，这不是本文的重点。

下面我们对打开 `vite.config.ts`，对打包进行配置（记得先安装下 @types/node ）

```javascript
import { readFileSync } from 'fs'
import path from 'path'
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

const packageJson = JSON.parse(
  readFileSync('./package.json', { encoding: 'utf-8' })
)
const globals = {
  ...(packageJson?.dependencies || {}),
}

function resolve(str: string) {
  return path.resolve(__dirname, str)
}

export default defineConfig({
  plugins: [react()],
  build: {
    // 输出文件夹
    outDir: 'dist',
    lib: {
      // 组件库源码的入口文件
      entry: resolve('packages/index.tsx'),
      // 组件库名称
      name: 'demo-design',
      // 文件名称, 打包结果举例: suemor.cjs
      fileName: 'suemor',
      // 打包格式
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      //排除不相关的依赖
      external: ['react', 'react-dom', ...Object.keys(globals)],
    },
  },
})
```

此时你在 `packages/index.tsx` 文件夹中任意 export 些代码，他应该可以被正确打包成 CommonJS 与 ESM 了。

## 组件编写

为了简单起见，我们组件就编写一个有类型支持且可以切换颜色的 Tag。

<img src="https://y.suemor.com/imagesimage-20221202141137213.png" alt="image-20221202141137213" style="zoom: 50%;" />

安装依赖

```bash
pnpm i less clsx -D
```

> 下面这些 react 代码就不介绍了

编写 `packages/Tag/interface.ts`

```typescript
import { CSSProperties, HTMLAttributes } from 'react'

/**
 * @title Tag
 */
export interface TagProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'ref'> {
  style?: CSSProperties
  className?: string | string[]
  /**
   * @zh 设置标签背景颜色
   * @en The background color of Tag
   */
  color?: Colors
}

type Colors = 'red' | 'orange' | 'green' | 'blue'
```

编写`packages/Tag/index.tsx`

```tsx
import clsx from 'clsx'
import { forwardRef } from 'react'
import './style'
import { TagProps } from './interface'

const Tag: React.ForwardRefRenderFunction<HTMLDivElement, TagProps> = (
  props,
  ref
) => {
  const { className, style, children, color, ...rest } = props

  return (
    <div
      ref={ref}
      style={style}
      {...rest}
      className={clsx(className, 's-tag', `s-tag-${color}`)}
    >
      {children}
    </div>
  )
}

const TagComponent = forwardRef<unknown, TagProps>(Tag)

TagComponent.displayName = 'Tag'

export default TagComponent
export { TagProps }
```

编写 `packages/Tag/style/index.less`

```less
@colors: red, orange, green, blue;

.s-tag {
  display: inline;
  padding: 2px 10px;
  each(@colors, {
    &-@{value} {
      background-color: @value;
      color: #fff;
    }
  });
}
```

编写 `packages/Tag/style/index.ts`

```typescript
import './index.less'
```

编写 `packages/index.tsx`

```tsx
export type { TagProps } from './Tag/interface'

export { default as Tag } from './Tag'
```

注意：此时如果我们进行打包会报错，因为我们没有安装 `@rollup/plugin-typescript` 插件，无法打包 ts 类型，生成 d.ts 。

```bash
pnpm i @rollup/plugin-typescript@8.5.0 -D    //这里最新版本似乎有些奇怪问题，所以我们先安装下 8.5.0 版本
```

去 `vite.config.ts` 引入插件

```typescript
import typescript from '@rollup/plugin-typescript'

plugins: [
    react(),
    typescript({
      target: 'es5',
      rootDir: resolve('packages/'),
      declaration: true,
      declarationDir: resolve('dist'),
      exclude: resolve('node_modules/**'),
      allowSyntheticDefaultImports: true,
    }),
  ],
```

此时我们执行 `pnpm build` ，就完成了打包，生成如下目录

![image-20221202145135814](https://y.suemor.com/imagesimage-20221202145135814.png)

## 发布 npm

但此时我们把包发布到 npm 上，用户依旧是无法使用的，我们还需在 `package.json`上定义一下基础入口信息和类型声明：

```javascript
{
  "name": "@suemor/demo-design",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/suemor.cjs",
  "module": "./dist/suemor.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/suemor.cjs",
      "import": "./dist/suemor.js"
    },
    "./style": "./dist/style.css"
  },
  "publishConfig": {
    "access": "public"
  },
    //指定你要上传到 npm 上的文件夹
  "files": [
    "dist"
  ],
  ...
}
```

完成之后执行，即可发布到 npm 上。

```bash
npm publish
```

之后在你的其它项目中引入，即可正常显示，且具备 TypeScript 的类型提示。

```tsx
import { Tag } from '@suemor/demo-design'
import '@suemor/demo-design/style'

const App = () => {
  return (
    <div>
      <Tag color="orange">我是标签</Tag>
    </div>
  )
}

export default App
```

<img src="https://y.suemor.com/imagesimage-20221202151736637.png" alt="image-20221202151736637" style="zoom: 50%;" />

自此一个简单的组件库主体部分开发完毕（虽然很不完善），下面引入单元测试。

## 添加单元测试

我们使用 vitest 进行单元测试:

```bash
pnpm i vitest jsdom @testing-library/react -D
```

打开 `vite.config.ts`文件，在文件**第一行**添加类型声明，并在`defineConfig`加几行配置，让 `rollup`处理`.test`文件:

```javascript
/// <reference types="vitest" />

test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: [ 'text', 'json', 'html' ]
    }
  }
```

再打开 `package.json` 添加 npm 命令:

```javascript
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
```

一般我们会把单测的代码放在 `__test__` 文件夹下，所以新建 `packages/Tag/__test__/index.test.tsx`，代码如下:

```typescript
import { describe, expect, it, vi } from 'vitest'

import { fireEvent, render, screen } from '@testing-library/react'

import { Tag, TagProps } from '../..'

const defineColor: Array<Pick<TagProps, 'color'> & { expected: string }> = [
  { color: 'red', expected: 's-tag-red' },
  { color: 'orange', expected: 's-tag-orange' },
  { color: 'green', expected: 's-tag-green' },
  { color: 'blue', expected: 's-tag-blue' },
]

const mountTag = (props: TagProps) => {
  return render(<Tag {...props}>Hello</Tag>)
}

describe('tag click', () => {
  const handleCallback = vi.fn()
  const tag = mountTag({ onClick: handleCallback })
  it('tag click event excuted correctly', () => {
    fireEvent.click(tag.container.firstChild as HTMLDivElement)
    expect(handleCallback).toHaveBeenCalled()
  })
})

describe.each(defineColor)('Tag color test', ({ color, expected }) => {
  it('tag color', () => {
    const tag = mountTag({ color })
    const element = tag.container.firstChild as HTMLDivElement
    expect(element.classList.contains(expected)).toBeTruthy()
  })
})
```

执行 `pnpm test`即可正常单元测试。

<img src="https://y.suemor.com/imagesimage-20221202163807821.png" alt="image-20221202163807821" style="zoom:50%;" />

## 完整代码

完整代码仓库: https://github.com/suemor233/suemor-design-demo
