# Maynooth Moodle ICS Service

做了一个 Maynooth Moodle 日历订阅服务，方便将 Moodle 日程集成到个人日历应用中（其实理论上用 moodle 的都可以用，不一定要是梅努斯）

能够在日程中显示课程作业截止时间、作业内容等等。

目前仍然是一个比较初步的版本。

## 使用方法

1. 获取 token，我这边写了一个文档来告诉你怎么获取 token：[获取 Maynooth Moodle Token](https://www.yuque.com/seeridia/wzmvi5/dll14c8qdo4orwi4?singleDoc)
2. 替换 `YOUR_TOKEN_HERE` 为你的 token，得到的便是你的订阅链接：

   ```
   https://moodle.seeridia.top/calendar?token=YOUR_TOKEN_HERE
   ```
3. 将该链接添加到你的日历应用中（例如 Google Calendar、Apple Calendar、小米日历等）

## 预览

![效果图](docs/Screenshot.jpg)