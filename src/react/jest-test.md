# React 单元测试

> 本文采用 Jest + React Testing Library 进行单元测试

## 背景

近期在尝试阅读 arco-design 源码，发现自动化测试对于组件的编写是相当的重要，可自己却对其一窍不通，于是学习了下单元测试的基础，因此写篇博客来记录下。

## 环境搭建

考虑到 Jest 对于 React 并不能开箱即用，需要对 babel 进行一些配置且还有一些坑，为了简单起见，我们直接使用 cra 脚手架。

```bash
npx create-react-app react-jest --template typescript
```

cra 已经帮我们配置好 Jest 的环境，且在 `./src/App.test.tsx` 帮我们写好了第一个测试用例，执行 `npm run test`即可运行。

## Jest

如果之前有遇见过单元测试的话，一定对 `describe it test`这三个词不会陌生，describe 表示一组分组，其中可以包含多组 test，而 it 是 test 的别名，有着相同的作用，因此以下两个写法是等价的。

```javascript
import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("first test", () => {
  test("renders learn react link", () => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
  });

  it("renders learn react link2", () => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
  });
});
```

其中`expect` 将在我们单元测试中频繁的用到，它的参数填入你需要进行判断的对象即可。而调用的 `toBeInTheDocument` 则是断言，用来告诉程序的预期是什么，但 `toBeInTheDocument` 是 `React Testing Library` 提供的额外断言 Api，我们将在下节介绍，在此之前我们先学习下 Jest 提供的内置断言 Api。

Jest 的断言分为六个方向:  **基础类型的比较、引用类型的比较、数字符号、正则匹配、表单验证错误抛出** 。别看这么多，其实很简单，都是字面意思，下面我们将对这几个断言分别举例。

### 基础类型

这里列举些相对常用的，剩下一部分可以自行去官网查看。

```javascript
// 都是字面意思，不过多解释
describe("examples for jest expect", () => {
  test("toBe", () => {
    expect(1 + 1).toBe(2);
    expect(1 + 1).not.toBe(3);

    expect(true).toBe(true);
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();

    expect(undefined).toBe(undefined);
    expect(undefined).not.toBeDefined();
    expect(undefined).toBeUndefined();

    const test = () => {
      console.log(test);
    };
    expect(test()).toBeUndefined();
  });
});
```

### 引用类型的比较

我们发现深拷贝得用 `toEqual` 才行

```javascript
test("引用类型的比较", () => {
    const a = { obj1: { name: "obj1", obj2: { name: "obj2" } } };
    const b = Object.assign(a);
    const c = JSON.parse(JSON.stringify(a));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toEqual(b);
    expect(a).toEqual(c);
})
```

### 数字符号

```javascript
test("数字符号", () => {
    // >
    expect(3).toBeGreaterThan(2);
    // <
    expect(3).toBeLessThan(4);
    // >=
    expect(3).toBeGreaterThanOrEqual(3);
    expect(3).toBeGreaterThanOrEqual(2);
    // <=
    expect(3).toBeLessThanOrEqual(3);
    expect(3).toBeLessThanOrEqual(4);
  });
```

### 正则匹配

`toMatch(regexp)` 会匹配字符串是否能够满足正则的验证，`toMatchObj(value)` 来验证对象是否包含 value 的全部属性

```javascript
test("正则匹配", () => {
    expect("This is a regexp validation").toMatch(/regexp/);
    const obj = { prop1: "test", prop2: "regexp validation" };
    const childObj = { prop1: "test" };
    expect(obj).toMatchObject(childObj);
  });
```

### 表单验证

```javascript
test("表单验证", () => {
    // 数组元素验证
    expect([1, 2, 3]).toContain(1);
    expect([1, 2, 3]).toEqual(expect.arrayContaining([1, 2]));
    expect([{ a: 1, b: 2 }]).toContainEqual({ a: 1, b: 2 });
    // 数组长度
    expect([1, 2, 3]).toHaveLength(3);
    // 对象属性验证
    const testObj = {
      prop1: 1,
      prop2: {
        child1: 2,
        child2: "test",
      },
    };
    expect(testObj).toHaveProperty("prop1");
    expect(testObj).toHaveProperty("prop2.child1");
  });
```

### 错误抛出

这里 `throwError` 方法只需要传入即可，不需要执行，不然会中断单侧。

```javascript
test("错误抛出", () => {
    const throwError = () => {
      const err = new Error("console err: this is a test error!");
      throw err;
    };
    expect(throwError).toThrow();
    expect(throwError).toThrowError();
  });
```

整体来说 Jest 几个内置断言还是挺简单的，我们把重点放在 `React Testing Library` 这个库上。

## React Testing Library

我们在单元测试时经常会涉及到 Dom 元素的选取，但只靠 `Jest`只能对纯 JavaScript 进行测试，因此我们需要借助 `React Testing Library` 这个库。

React Testing Library 提供的查询 API 很多，一般分为行为和参照物两个维度，我们先讲行为。

### 行为查询

行为角度上，查询 API 可以包含三种类别 `getBy queryBy findBy`，它们各自又包含单查和多查，也就是`getBy queryBy findBy getAllBy queryAllBy findAllBy`

- Get：返回查询的匹配节点，如果没有找到就会报错。
- Query：返回查询的匹配节点，如果没有元素匹配会返回 null，并不会报错。
- Find：返回一个 Promise，默认超时时间为 1000 ms， 如果没有元素匹配或者查找超时，Promise 状态切为 reject 。 

我们看到最开始的示例，这是一个 get 的单查，也就是说如果页面有多个含有 `learn react ` 的标签，那边这个单元测试就会报错。

```javascript
import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders learn react link", () => {
  	// 渲染一个组件
    render(<App />);
    // 查询出含有 learn react 的标签，注意行为查询是单指 getBy，后面的 Text 是参照物，这在下节会讲
    const linkElement = screen.getByText(/learn react/i);
  	// 断言这个标签时是否成功渲染
    expect(linkElement).toBeInTheDocument();
  });
```

修改 `App.tsx`

```jsx
function App() {
  return (
    <div>
      <div>test1</div>
      <div>test2</div>
    </div>
  );
}
```

修改 `App.test.tsx`

```javascript
  test("render div", () => {
    render(<App />);
    const divElement = screen.getAllByText(/test/i);
    screen.debug(divElement);
  });
```

可以看到这里把两个 div 都选取了。

这里大家可以自己写点代码测试下，我就不过多举例了。

### 参照物查询（重点）

之前我们使用到的 `getByText`，其中的 Text 就是一种参照物，除此之外还有 7 种参照物，分别为 `Role LabelText PlaceholderText DisplayValue AltText Title Testid`我们将在这里详细说明。

看到这里你可能会非常疑惑，为什么 `React Testing Library` 不能像 JavaScript 选取 Dom 一样，通过 class 或者 id 方式选取，这样不是更方便吗？

其实也有通过这类方式选取的测试框架例如 `Enzyme`，但我们使用的 React Testing Library 是站在用户视角进行测试，CSS 类名等则是针对代码细节的单测。但要知道测试用例和软件的使用方式越相近，就是越稳健的测试。这也是 React Testing Library 并不建议以代码细节作为参照物的原因，这些从用户视角并不容易感知到，容易导致用例脆弱、不稳定。

#### Role

`Role` 是我们最常用到的参照物，在我们单元测试中也尽可能通过 Role 来选取。

了解过 `ARIA` 应该知道，我们的标签都会有一个隐性的 ARIA role 属性来表示它的语义，例如 button 它的 role 就是 `button`，具体每个标签对应的 role 是什么，请自行查询，这里就不列举了。

可以看到下方我们通过 button 的 role 成功选取到了 button。

```jsx
function App() {
  return (
    <div>
      <button>test</button>
    </div>
  );
}
```

```javascript
  test("button role", () => {
    render(<App />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
```

但有时我们会有多个相同的元素，这里我们可以添加 aria 属性，如下我们要选取第二个 button。

```javascript
function App() {
  return (
    <div>
      <button>test</button>
      <button aria-pressed>test2</button>
    </div>
  );
}
```

```javascript
  test("button role", () => {
    render(<App />);
    const button = screen.getByRole("button",{pressed:true});
    expect(button).toBeInTheDocument();
  });
```

下方是 role 查询支持包含`aria-pressed`

- `aria-hidden`： 不在 DOM 树上访问的元素
- `aria-selected`: 元素是否被选中
- `aria-checked`: 元素是否被勾选
- `aria-current`: 当前选中的元素
- `aria-pressed`: 被按压的元素
- `aria-expanded`:元素是否被展开
- `aria-level`: 区域的等级，值得一提的是，h1 - h6 会有默认的`aria-level`属性，值对应1-6
- `aria-describedby`: 可以通过描述来定位额外的元素
- `aria-label`: 用来给当前元素加上的标签描述

在我们实际项目中当某一个角色数量很多时，我们一般会配合`aria-label `，来筛选内容，如下要选取最后一个 div。

```jsx
function App() {
  return (
    <div>
      <div>1</div>
      <div>2</div>
      <div aria-label="div_test">3</div>
    </div>
  );
}
```

```javascript
  test("div role", () => {
    render(<App />);
    // div 的 role 是 generic
    const div = screen.getByRole("generic",{name:'div_test'});
    expect(div).toBeInTheDocument();
  });
```

#### LabelText

除了 Role 以外，我们也可以通过 label 标签的 text 查询，通过这个可以查询到对应 label 的输入节点（比如 input)。

```jsx
function App() {
  return (
    <div>
      <label>
        testLabel
        <input type="checkbox" />
      </label>
    </div>
  );
}
```

```javascript
  test("input", () => {
    render(<App />);
    const input = screen.getByLabelText("testLabel");
    expect(input).toBeInTheDocument();
  });
```

#### Placeholdertext

顾名思义，通过 placeholder 查询

```jsx
function App() {
  return (
    <div>
        <input placeholder="a query by placeholder" />
    </div>
  );
}
```

```javascript
  test("placeholder", () => {
    render(<App />);
    const placeholderInput = screen.getByPlaceholderText(
      "a query by placeholder"
    );
    screen.debug(placeholderInput);
  });
```

#### Text

之前一直在用，通过文本内容

```javascript
  test("renders learn react link", () => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
  });
```

#### DisplayValue

通过表单的 defaultValue

```jsx
export const App = () => {
  return (
    <div>
      <input defaultValue="a query by value" readOnly />
    </div>
  );
};
```

```javascript
   test("value", () => {
    render(<App />);
    const valueInput = screen.getByDisplayValue("a query by value");
    screen.debug(valueInput);
  });
```

#### altText

```jsx
export const App = () => {
  return (
    <div>
       <img alt="a query by alt" />
    </div>
  );
};
```

```javascript
   test("alt", () => {
    render(<App />);
    const altImg = screen.getByAltText("a query by alt");
    screen.debug(altImg);
  });
```

#### title

就是标签的 popover 的效果

```jsx
export const App = () => {
  return (
    <div>
      <span title="a query by title" />
    </div>
  );
};
```

```javascript
   test("title", () => {
    render(<App />);
    const title = screen.getByTitle("a query by title");
    screen.debug(title);
  });
```

#### testid

这个就是新增 data-testid 属性来进行查询，用的比较少。

```jsx
export const App = () => {
  return (
    <div>
        <div data-testid="a not so good query"></div>
    </div>
  );
};
```

```javascript
test("testid", () => {
  render(<App />);
  const testidItem = screen.getByTestId("a not so good query");
  screen.debug(testidItem);
});
```

### 元素的断言

React Testing Library 有它的专属断言 Api ，例如之前的`toBeInTheDocument`就是一个，这节比较简单，都是字面意思。

#### 页面可见

- `toBeEmptyDOMElement`：标签之间是否有可见内容， 即使是空格也会失败；
- `toBeVisible`：是否可见，从用户直接观察的角度看能否可见；
- `toBeInTheDocument`：是否存在在文档中，document.body 是否存在这个元素。

```jsx
export const App = () => {
  return (
    <div>
      <div aria-label="empty_note"></div>
      <div role="note" style={{ display: "none" }} aria-hidden>
        1234
      </div>
      <div role="note">1234</div>
    </div>
  );
};
```

```javascript
 test("visible validation", () => {
    render(<App />);
    const emptyNote = screen.getByRole("generic", { name: "empty_note" });
    const [hiddenNote] = screen.getAllByRole("note", { hidden: true });
		// 只选取 hidden: false
    const normalNote = screen.getByRole("note");
    expect(emptyNote).toBeEmptyDOMElement();
    expect(hiddenNote).not.toBeVisible();
    expect(emptyNote).toBeInTheDocument();
    expect(hiddenNote).toBeInTheDocument();
    expect(normalNote).toBeInTheDocument();
  });
```

这里  `aria-hidden` 并不会影响 visible 的判断，只是一个语意属性。

#### 表单验证

- `toBeDisabled` ：检查元素是否通过 disable 属性判断，而不是 aria-disabled；
- `toBeEnabled`: 是否未被禁用，等同于 `.not.toBeDisabled`；
- `toBeRequired`: 元素是否必填；
- `toHaveFocus`: 元素是否聚焦；
- `toBeChecked`: checkbox 或者是 radio 是否被选中；
- `toHaveFormValues`：验证整体表单的值是否和预期值匹配；
- `toHaveValue`：与 `toHaveFormValues` 类似，不过不同的是 `toHaveValue` 验证某个单独的表单元素，而不是全部。

```jsx
export const App = () => {
  return (
    <div>
      <form aria-label="form">
        <input
          type="text"
          name="username"
          disabled
          aria-disabled
          defaultValue="zhenmin"
          />
        <input type="number" name="age" defaultValue={23} required />
        <input
          type="radio"
          name="sex"
          value="man"
          defaultChecked
          aria-checked
          />
        <input type="radio" name="sex" value="woman" />
      </form>
    </div>
  );
};
```

```javascript
  test("form validation", () => {
    render(<App />);
    const form = screen.getByRole("form");
    const username = screen.getByRole("textbox");
    const age = screen.getByRole("spinbutton");
    const manCheckbox = screen.getByRole("radio", { checked: true });
    const womanCheckbox = screen.getByRole("radio", { checked: false });
    expect(username).toBeDisabled();
    expect(age).toBeEnabled();
    expect(age).toBeRequired();
    age.focus();
    expect(age).toHaveFocus();
    expect(manCheckbox).toBeChecked();
    expect(womanCheckbox).not.toBeChecked();
    expect(form).toHaveFormValues({
      username: "zhenmin",
      age: 23,
      sex: "man",
    });
    expect(age).toHaveValue(23);
  });
```

#### 代码层面验证

验证是否包含类、属性或者样式

- `toHaveAttribute`: 匹配元素是否具备某个值的属性；
- `toHaveClass`: 匹配元素在类属性中是否包含某个类；
- `toHaveStyle`: 匹配元素是否具有对应样式，需要注意的是，这个是精准非模糊匹配，例如 `display: none` 无法匹配` display:none;color:#fff;`。

```jsx
export const App = () => {
  return (
    <div>
      <div
        role="note"
        style={{ display: "none" }}
        className="test hidden"
        aria-hidden
      >
        1234
      </div>
    </div>
  );
};
```

```javascript
test("code validation", () => {
  render(<App />);
  const [hiddenNote] = screen.getAllByRole("note", { hidden: true });
  expect(hiddenNote).toHaveAttribute("aria-hidden");
  expect(hiddenNote).toHaveClass("hidden");
  expect(hiddenNote).toHaveStyle("display: none");
});
```

