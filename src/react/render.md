# React 中的 memo、useMemo及useCallback

> 距离我接触 react 已经过去几个月了，在此期间，关于如何避免重复渲染的问题一直困惑着我，因此今天就来聊聊这个话题。

在讲述如何进行性能优化之前，我们先来谈谈 React 为什么会重新渲染。

## React 为什么会重新渲染

**状态改变是 React 树内部发生更新的唯二原因之一**。

```javascript
import { useState } from "react";

const App = () => {
  let [color, setColor] = useState("red");
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <ExpensiveTree />
    </div>
  );
};

const ExpensiveTree = () => {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // 延迟
  }
  console.log('render');
  return <p>I am a very slow component tree.</p>;
};

```

![input例子](https://y.suemor.com/imagesimage-20221005014239812.png)

很明显，每当我们在 input 里面输入内容，`console.log('render')`都会输出，因为 `color` 的状态发生了改变，也间接说明了其与 **props 完全没有关系**

这样的开销是很不合理的，我们接下来会优化它。

## 性能优化

### 方式一: State 抽离

我们知道 react 是**单向数据流**，因此我们只需要将 State 的抽离出来即可。

```javascript
import { useState } from "react";

const App = () => {
  return (
    <div>
      <Input />
      <ExpensiveTree />
    </div>
  );
};

const ExpensiveTree = () => {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // 延迟
  }
  console.log("render");
  return <p>I am a very slow component tree.</p>;
};

const Input = () => {
  let [color, setColor] = useState("red");

  return <input value={color} onChange={(e) => setColor(e.target.value)} />;
}
```

### 方式二: memo 

React.memo 其为高阶组件，可以使被它包裹的组件变为纯组件，也就是只要它的 prop 不改变，react 就不会更新它。

```javascript
import { memo, useState } from "react";

const App = () => {
  let [color, setColor] = useState("red");
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <ExpensiveTree />
    </div>
  );
};

const ExpensiveTree = memo(() => {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // 延迟
  }
  return <p>I am a very slow component tree.</p>;
})
```

### 方式三: react children

因为 App 并没有发生状态改变所以 ExpensiveTree 避免了重复渲染

```javascript
import { FC, PropsWithChildren, useState } from "react";

const App = () => {
  return (
    <ColorWrapper>
      <ExpensiveTree />
    </ColorWrapper>
  );
};

const ColorWrapper: FC<PropsWithChildren> = ({ children }) => {
  let [color, setColor] = useState("red");
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      {children}
    </div>
  );
};

const ExpensiveTree = () => {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // 延迟
  }
  return <p>I am a very slow component tree.</p>;
};
```



## 使用useMemo 和 useCallback

### useMemo

useMemo 有点类似于 vue 中的 `Computed`，只有当依赖变化时，才会重新计算出新的值。

这样当 input 发生改变的时候 dirtyWork 就不会重复的去执行。

```javascript
import { useMemo, useState } from "react";

const App = () => {
  let [color, setColor] = useState("red");
  const [number,setNumber] = useState(0)
  
  const dirtyWork = useMemo(() => {
    console.log('正在进行大量运输');
    return number
  },[number])
  
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <h1>{dirtyWork}</h1>
    </div>
  );
};
```

另外上一节的例子我们也可以通过 useMemo 进行修改

```javascript
import { memo, useMemo, useState } from "react";

const App = () => {
  let [color, setColor] = useState("red");
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      {useMemo(
        () => (
          <ExpensiveTree />
        ),
        []
      )}
    </div>
  );
};

const ExpensiveTree = () => {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // 延迟
  }
  return <p>I am a very slow component tree.</p>;
};
```

### useCallback

我们先看如下例子

```javascript
import { FC, memo, useState } from "react";

const App = () => {
  let [color, setColor] = useState("red");
  const fn = ()=> {
    console.log('hahaha');
  }
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <ExpensiveTree fn={fn}/>
    </div>
  );
};

const ExpensiveTree:FC<{fn:()=>void}> = memo(({fn}) => {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // 延迟
  }
  console.log('render'); // 依旧会被不断更新
  return <p>I am a very slow component tree.</p>;
})
```

我们发现即使 ExpensiveTree 包裹 memo ，但在 input 里面输入内容， ExpensiveTree 依旧会被更新，这时我们只要给父组件 fn 函数包裹一层 useCallback 即可

因此 useCallback 一般用于需要将函数传递给子组件的情况，我们用 useCallback 改写上面的例子：

```javascript
import { FC, memo, useCallback, useState } from "react";

const App = () => {
  let [color, setColor] = useState("red");
  const fn = useCallback(()=> {
    console.log('hahaha');
  },[])
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <ExpensiveTree fn={fn}/>
    </div>
  );
};

const ExpensiveTree:FC<{fn:()=>void}> = memo(({fn}) => {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // 延迟
  }
  console.log('render');
  return <p>I am a very slow component tree.</p>;
})

```

你可能会发现 useCallback 其实就是 useMemo 的语法糖，如上例子也可以使用 useMemo 改写

```javascript
import { FC, memo, useMemo, useState } from "react";

const App = () => {
  let [color, setColor] = useState("red");
  const fn = useMemo(() => {
    return () => console.log("hahaha");
  }, []);
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <ExpensiveTree fn={fn} />
    </div>
  );
};

const ExpensiveTree: FC<{ fn: () => void }> = memo(({ fn }) => {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // 延迟
  }
  console.log("render");
  return <p>I am a very slow component tree.</p>;
});
```



## 参考资料

* [React 为什么重新渲染](https://blog.skk.moe/post/react-re-renders-101/#Chun-Zu-Jian-He-memo)
* [Before You memo()](https://overreacted.io/before-you-memo/)