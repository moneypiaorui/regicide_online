# 弑君者联机版
## 开始
- 服务端用nodejs写的，安装好nodejs后进入server文件夹，在终端输入node server.js启动服务端
- 然后web文件夹打开index.html即可游玩
## 功能介绍
- 登录界面可以看到所有房间信息(但要刷新页面才能更新显示)，并在登录框输入房间号和昵称加入对应房间
- 进入房间后第一个进入的玩家成为房主，房主离开顺位第二个进入的玩家成为房主
- 只有房主会显示“开始游戏”按钮，点击开始游戏后，房间进入game状态，无法再加入房间
- 游戏过程中如果玩家离开，游戏会强制结束，房间回到wait状态
- 游戏过程中如果一轮攻击中所有玩家都跳过or所有玩家都死亡，游戏结束，房间回到wait状态
## 规则介绍
详情见[我的博客](http://47.96.132.249/index.php/2023/11/26/%e5%bc%91%e5%90%9b%e8%80%85%e6%89%91%e5%85%8b%e6%a1%8c%e6%b8%b8%e8%a7%84%e5%88%99/)

PS有些规则没有实现：
- 单人模式
- 鬼牌
- 连招数值和不超过10(没加是因为加了这个规则游戏会很难)
- 防御特效为了代码实现简单我改成了削减boss攻击，不然防御牌打出来要单独添加到防御牌堆，boss死亡后才加入弃牌堆
## bug
- ### ~~双人模式游戏进行时一个人退出再进入，在准备阶段会显示他的卡牌，疑似上次游戏遗留的~~
 已解决：将gameover函数放在sendPlayerState之前调用即可解决
- 双人模式当一个人攻击后无法支付boss伤害时，双方都无法显示按钮
- 双人模式游戏进行时一个人退出再进入，游戏开始后会有一直一个人出牌bug，而且出完牌后牌不会消失

## 后续功能添加
- 房间语音系统
- 房间密码
- 流畅的动画
- 完善的系统提示
- 显示每个人的攻击和死亡状态
- 添加场景图片
- 登录页面添加timeInterval持续更新房间信息
- 添加单人模式和鬼牌的逻辑