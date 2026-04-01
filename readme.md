项目是agentE  
中文名一句成片

用户单凭口喷做sass视频，面向短视频、营销内容和知识表达的自动化视频生产平台。把一句话，变成一支可交付的视频。 从自然语言到代码，再到最终成片，让视频创作进入可编程时代。

nextjs+gpt-api+remotion+ffmpeg


#  基本流程
## 用户口喷自然语言 -> tsx模板代码,网页动画 -> headless多浏览器进程截图,每秒60帧视频
## 1-2是我们要做的, 2-3: remotion+ffmpeg已经做了

# 技术栈
# remotion + react + typescript + ffmpeg
# pnpm 管理依赖包
# 使用typescirpt来创建tsx模板代码


## 现有bug
生成的react代码，如tsx模板，截多帧图片通过ffmpeg渲染成视频时
网页组件覆盖，导致动画覆盖
一段时间内组件需要错峰显示
