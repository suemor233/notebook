# JavaScript 的宏任务与微任务

> 本文部分概念通过作者自己理解来叙述，可能存在一些错误，~~毕竟我也是萌新~~，还请多多指点～

此前在我学习 js 的过程中一直有一个疑惑：`其明明是一个单线程语言，为何会存在异步的概念？这不是自相矛盾吗？`

## 单线程的 JS

事实上 js 的确是单线程的，如果是只是从 js 这门语言上来说，异步的确是不存在的 。我们平日所谓的异步其实是**依靠浏览器的两个或者两个以上的常驻线程来完成的（nodejs 则是 libuv）**。按我的理解来说就是 js 其实是伪异步，其异步的实现是依靠运行环境。

## 任务队列和事件循环

```javascript
new Promise((resolve) => {
  resolve()
}).then(() => {
  console.log(222)
})

console.log(111)
```

答案为: ~~111 222~~

当 js 执行过程中遇到异步代码时，异步代码并不会立即被执行，而是会被放入**任务队列**中，等执行栈中的所有同步任务执行完毕，系统就会读取任务队列，将可运行的异步任务添加到可执行栈中，开始执行。

像如上`同步任务执行完毕，系统读取任务队列并执行`这一流程就是**事件循环**。

## 宏任务

任务队列我们会区分出**宏任务队列和微任务队列**，我们这里先讨论宏任务。

宏任务包括: 

* script(整体代码)
* setTimeout
* setInterval
* I/O
* UI交互事件
* postMessage
* MessageChannel
* setImmediate(Node.js 环境)

也就是说我们**整体代码一开始是作为宏任务执行的**，当遇到如上事件时，那段代码会被推入**宏任务队列**，等当前执行栈执行完毕后，接着执行微任务（这个下面就讲），再执行此宏任务队列。

## 微任务

微任务包括: 

* Promise.then
* Object.observe
* MutationObserver
* process.nextTick(Node.js 环境)

当我们一开始的宏任务执行过程中，当遇到如上事件时，那段代码会被推入微任务队列，等当前宏任务执行栈执行完毕后，将微任务队列压入调用栈，执行微任务

<img src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fwww.webge.net%2Fzb_users%2Fupload%2F2020%2F07%2F202007271433008231271.png&refer=http%3A%2F%2Fwww.webge.net&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1660539678&t=8f82a349d935d112acc410585b894c16" alt="img" style="zoom: 50%;" />

**一定要记住下面这个顺序**

```javascript
宏任务->微任务->渲染->宏任务->...
```

这也说明了 setTimeout 有时并未按预期时间执行的原因，因为前面还要执行微任务和渲染视图。

另外, `Promise` 是有一点特殊性的，因为**Promise构造函数中函数体的代码都是立即执行的** ,  `Promise.then()` 和 `Promise.catch()` 属于微任务，也就是 `resolve()` 和 `reject()`

```javascript
...
new Promise((resolve) => {
  console.log(111) //此行代码与微任务无关，会在开始的宏任务过程中依次执行
  resolve()
}).then(() => {
  console.log(222)
})

```

答案

~~111  222~~

`async await`也是一样，await 的返回值和函数下面的内容才属于微任务

```javascript
(async () => {
  console.log('222')
  await fetch('https://api.github.com/users/github');
  console.log('333')
})()
console.log('111')
```

答案

~~222  111  333~~

## 例题

下面来做一道简单例题

```javascript
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('asnyc1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeOut');
}, 0);

async1();

new Promise(function (reslove) {
  console.log('promise1');
  reslove();
}).then(function () {
  console.log('promise2');
})
```

答案

```javascript
script start
async1 start
async2
promise1
script end
asnyc1 end
promise2
setTimeOut

1、执行console.log('script start')，输出script start；
2、执行setTimeout，是一个异步动作，放入宏任务异步队列中；
3、执行async1()，输出async1 start，继续向下执行；
4、执行async2()，输出async2，并返回了一个promise对象，await让出了线程，把返回的promise加入了微任务异步队列，
   所以async1()下面的代码也要等待上面完成后继续执行;
5、执行 new Promise，输出promise1，然后将resolve放入微任务异步队列；
6、执行console.log('script end')，输出script end；
7、到此同步的代码就都执行完成了，然后去微任务异步队列里去获取任务
8、接下来执行resolve（async2返回的promise返回的），输出了async1 end。
9、然后执行resolve（new Promise的），输出了promise2。
10、最后执行setTimeout，输出了settimeout。
```

## 参考

[async/await、promise和setTimeout执行顺序](https://www.zhihu.com/question/492027998/answer/2374140959)

[js中的宏任务与微任务](https://zhuanlan.zhihu.com/p/78113300)

[一文搞懂JS系列（六）之微任务与宏任务，Event Loop](https://zhuanlan.zhihu.com/p/268097266)