#制定node镜像的版本
FROM node:8.12.0-alpine
#声明作者
MAINTAINER wulichenyang@163.com
#移动当前目录下面的文件到app目录下
ADD . /nodeProject/
#进入到nodeProject目录下面，类似cd
WORKDIR /nodeProject
#安装依赖
RUN yarn
#对外暴露的端口
EXPOSE 3838
#程序启动脚本
CMD ["yarn", "start"]