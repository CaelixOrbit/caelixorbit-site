# CaelixOrbit-site

`caelixorbit.space` 的个人静态网站源码。

这个项目用于承载 Caelix 的个人主页、联系信息、QSL 卡片，以及从 [`Today-I-Learned`](https://github.com/CaelixOrbit/Today-I-Learned) 生成的笔记页面。

## 内容

笔记内容来自独立仓库 [`Today-I-Learned`](https://github.com/CaelixOrbit/Today-I-Learned)，并在构建时转换为站点可读取的静态数据。

## 本地初始化

第一次克隆本站仓库后运行：

```sh
npm install
git submodule update --init --remote --recursive
```

## 常用命令

```sh
npm run dev
npm run notes:build
npm run build
npm run preview
```

- `npm run dev`：启动本地开发服务器。
- `npm run notes:build`：读取 Markdown 笔记，生成 `public/content/notes.json` 和图片资源。
- `npm run build`：先生成笔记数据，再做类型检查并打包到 `dist/`。
- `npm run preview`：本地预览已经打包好的 `dist/`。

## 本地预览最新笔记

如果只想在网站项目里查看最新 TIL 内容：

```sh
git submodule update --init --remote --recursive
npm run dev
```

如果要确认生产构建是否正常：

```sh
git submodule update --init --remote --recursive
npm run build
```
