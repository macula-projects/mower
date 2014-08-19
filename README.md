# Mower  - [v1.0.0]


## Help the project
__Install__

    一、安装Node.js

        1.普通安装：在http://nodejs.org/download/处下载对应的msi文件，点击安装，一路到底，结束；

        2.干净安装：同样是在http://nodejs.org/download/处，下载Windows Binary (.exe)格式的文件node.exe，然后放置在D:\nodejs文件夹下面，将D:\nodejs文件夹加入系统PATH变量，以便全局都可以使用，结束；

        可以在dos下用 node -v 命令测试。

    二、安装NPM：

        1.在https://github.com/isaacs/npm/tags处获取NPM的源码，如果已经安装过Git的，也可以通过git下载：

        git clone --recursive git://github.com/isaacs/npm.git

        2.下载到NPM的源码后，解压缩，比如我们解压在D:\npm，在DOS中，转到此文件夹下，然后执行如下命令安装NPM：

        node cli.js install npm -gf

				在执行这段代码之前，请确保node.exe是跟通过node.msi的方式安装的，或者在PATH环境变量中。
				
        完成后，将D:\NodeJS\node_modules文件夹加入PATH系统变量，并删除D:\npm文件夹（没用了）即可。

        可以在dos下用 npm -v 命令测试。

    三、安装CLI:

        1.首先需要在全局环境中安装Grunt command line interface (CLI)，安装时可能需要使用sudo（针对OSX、*nix、BSD等系统中）权限
        或者作为管理员（对于Windows环境）来执行以下命令：

        npm install -g grunt-cli

            如果从0.3版本升级，需要先卸载旧版：

            npm uninstall -g grunt

    四、安装Grunt 和 Grunt插件

        1.作为管理员（对于Windows环境）,通过命令行进入项目工程根目录，执行以下命令:

        npm install

    五、运行项目

        1.作为管理员（对于Windows环境）,通过命令行进入项目工程根目录，执行以下命令:

        grunt serve

        执行成功后，命令窗口出现 Waiting 字符。

        打开浏览器访问：http://localhost:9000 ,即可访问 samples 目录下文件.

## Live demo



## Features


## Required


## Documentation


## Release History
7 August 2014 - Mower 1.0
Initial release to public.

    
## Copyright and license

Code and documentation copyright 2014 Infinitus, Inc. Code released under [the Apache license](LICENSE).

