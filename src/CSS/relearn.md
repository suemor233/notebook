# 	重学CSS

> 先说下我的黑历史

我是 2022 年初开始接触 web 前端的（先前写过 Android ），当时我有极其少量的三件套基础，便直接开启了前端工程化的学习。显然这个决定是愚蠢的，要知道当时我连 es6 都不了解，看着 Vue 的官方文档更是一脸懵逼，就这样懵懵懂懂靠记忆 api 的方式学习了Vue的基础知识后，发现三件套基础是多么的重要。于是我便恶补了下 js 基础，看了下红宝书，可以说对js有了个重新的认识。

重温 js 以外还有个大坑等着我去填，那莫非就是 CSS 了。可惜我的 CSS 基础可能比js还拉垮，几个基础布局傻傻分不清，对响应式系统更是一脸懵逼。这肯定是不行的。于是最近重学了 CSS，阅读了下《CSS in Depth》这本书，写篇博客来巩固下 CSS 的一些盲区。

## 使用相对单位

### 相对单位的好处

CSS 的属性单位分为两大类，分别为绝对单位(px,in,pt,nn,cm)和相对单位(%,em,rem,vw,vh)。如果你使用的是绝对单位，那么它放在哪里都一样大，而相对单位的值会根据外部因素发生变化。比如，2em 的具体值会根据它作用到的元素（有时甚至是根据属性）而变化。

我们编写 CSS 肯定是要考虑到响应式的，相对单位就是 CSS 用来解决响应式的一种工具，我们可以基于窗口大小来等比例地缩放字号，而不是固定为 16px，或者将网页上的任何元素的大小都相对于基础字号来设置，然后只用改一行代码就能缩放整个网页，所以我们应该停止像素( px )思维，尽可能使用 em 和 rem 这两个相对单位来布局我们的网页。**我一般会用 rem 设置字号，用 px 设置边框，用 em 设置 其他大部分属性，尤其是内边距、外边距和圆角（不过我有时用百分比设置容器宽度）**。

有时候会看到某些教程会出现如下写法，我认为应当避免，这么做浏览器的默认字号会从16px 缩小为 10px，这的确能简化计算，但也会暴露出很多问题。

```css
:root { 
  font-size: .625em; //因当避免这种写法
}
```

1. 我们被迫写很多重复的代码。10px 对大部分文字来说太小了，所以需要覆盖它，最后就得给段落设置 1.4rem。
2. 这种做法的本质还是像素思维，在响应式网页中，需要习惯“模糊”值。比如1.2em 到底是多少像素并不重要，重点是它继承的字号要稍微大一点。

### 响应式根元素 font-size

为了能够让我们的代码具有响应式，我们应该设置响应式根元素 font-size，这样在不同大小的屏幕上会有更加优秀显示效果，从而避免更多的媒体查询。而且如果你正确使用 rem 和 em 的话，只需要改一行代码就能改变整体的字号，进而不费吹灰之力影响整个网页。

```css
:root {
  font-size: 0.75em;
}
@media (min-width: 800px) {
  :root {
    font-size: 0.875em;
  }
}
@media (min-width: 1200px) {
  :root {
    font-size: 1em;
  }
}
```

其实除了上述写法，我们还可以用 vw 来定义字号

```css
:root { 
  font-size: calc(0.5em + 1vw); 
}

@media (min-width: 50em) { 
  :root { 
    font-size: 1.125em; //避免某些宽屏字体过大
  } 
}
```

这样我们就可以更简单实现了大部分的响应式策略

### 缩放单个组件

我们编写前端代码，肯定会拆分出一些组件。我们可以给拆分出来组件的父元素加上声明` font-size: 1rem`，接着我们可以对子元素改用 em 而不是用 rem，使其相对于刚刚在 1rem 时创建的父元素的字号.

```css
.panel {
  font-size: 1rem;
  padding: 1em;
  border: 1px solid #999;
  border-radius: 0.5em;
}

.panel > h2 {
  margin-top: 0;
  font-size: 0.8em;
  font-weight: bold;
  text-transform: uppercase;
}
```

这么做可以为以后创建更大的面板做好了准备，只需要加一行 CSS 代码，即覆盖父元素的 1rem，子元素的大小也会随之而改变。

### 使用 max-width

如果我们直接使用 width 指定大小时，当浏览器窗口比元素的宽度还要窄时，浏览器会显示一个水平滚动条来容纳页面。因此使用 max-width 替代 width 可以使浏览器更好地处理小窗口的情况。这点在移动设备上显得尤为重要。

```css
#main {
  max-width: 600px;
  margin: 0 auto; 
}
```

## 自定义CSS变量

CSS3中有一个新特性，我们可以不用CSS预处理器，而直接使用原生CSS来创建变量。

```css
:root {
  --brand-color: #369;
}

p {
  color: var(--brand-color, blue);
}
```

并且我们可以借助 js ，从而更方便的更改网页主题

## 猫头鹰选择器

猫头鹰选择器可以更方便的给页面有着相同父级的非第一个子元素加上外边距

```css
* + * {  
  margin-top: 1.5em; 
}
```

我们举个代码中的例子，可以非常方便的设置边距

```html
<style>
  .a {
    background-color: skyblue;
  }
  .warp div + div {
    margin-top: 1.5em;
  }
</style>


<div class="warp">
    <div class="a">我是div</div>
    <div class="a">我是div</div>
    <div class="a">我是div</div>
    <div class="a">我是div</div>
</div>
```

<img src="https://suemor.oss-cn-beijing.aliyuncs.com/img/image-20220504235528506.png" alt="image-20220504235528506" style="zoom:50%;" />

## 总结

我们主要介绍了下 CSS 的相对单位(毕竟之前的我全程px写到尾，然后滥用媒体查询)，以及一些容易被人忽略的特性，除此之外CSS的知识点还有很多很多，我们可以去 [MDN文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS) 来了解更多。

## 参考
* 《CSS in Depth》