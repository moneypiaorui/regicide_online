# 弑君者联机版
## 开始
服务端用nodejs写的，安装好nodejs后进入server文件夹，在终端输入node server.js启动服务端
然后web文件夹打开index.html即可游玩
## 功能介绍
- 登录界面可以看到所有房间信息(但要刷新页面才能更新显示)，并在登录框输入房间号和昵称加入对应房间
- 进入房间后第一个进入的玩家成为房主，房主离开顺位第二个进入的玩家成为房主
- 只有房主会显示“开始游戏”按钮，点击开始游戏后，房间进入game状态，无法再加入房间
- 游戏过程中如果玩家离开，游戏会强制结束，房间回到wait状态
## 规则介绍
## bug
### 双人模式游戏进行时一个人退出再进入，在准备阶段会显示他的卡牌，意思上次游戏遗留的
#### 已解决：将gameover函数放在sendPlayerState之前调用即可解决
### 双人模式当一个人攻击后无法支付boss伤害时，双方都无法显示按钮
### 双人模式游戏进行时一个人退出再进入，游戏开始后会有一直一个人出牌bug，而且出完牌后牌不会消失

## 后续功能添加
- 房间语音系统
- 房间密码
- 流畅的动画
- 完善的系统提示
- 显示每个人的攻击和死亡状态
- 添加场景图片
- 登录页面添加timeInterval持续更新房间信息