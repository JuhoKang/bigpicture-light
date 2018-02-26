# bigpicture-light

**bigpicture-light** is a Web-Based Large-Scale Drawing & Communication Application.

> bigpicture-light provides a large playground to draw and chat with each other online.

Consumer demand for contents are increasing. Traditionally text, video, image sharing are the basic ways for Social networking and sharing. Big-picture project tries to find a way to share with other people with their own drawing. Drawing unique pictures together with different users across the net will create a new sense of Internet culture.

## Overview

![intro](https://github.com/JuhoKang/bigpicture-light/blob/master/bpimage1.png)
![color picking](https://github.com/JuhoKang/bigpicture-light/blob/master/bpimage2.png)

## video
[![Video link](https://img.youtube.com/vi/Tn8WEewwzwc/0.jpg)](https://www.youtube.com/watch?v=Tn8WEewwzwc)

## Features
* Real-time drawing
* Free virtual space to draw on everywhere, anywhere
* Free (has limits for optimal performance) zoom in, out. drawing based on vector image
* Undo what you draw in real time
* Simple chatting with other people based on user present coordinates
* Simple brush change settings
* Simple, intuitive map to show where you are
* Ping on the map to show other people where you are
* Saving brush configs with the right click menu

## Installation and Settings

#### Build Requirements

* `node 6.11.3+`
* `ubuntu 14.04 LTS+`

#### Installation

    git clone https://github.com/JuhoKang/bigpicture-light.git
    cd bigpicture-light 
    npm install
    DEBUG=big-picture:* npm run devstart

you need cairo for node-canvas dependency

    $ sudo apt-get update 
    $ sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++ 
    
you need zlib1g-dev for sharp dependency
###### always import sharp before fabric.
    $ sudo apt-get install zlib1g-dev
    
## Third Party Libraries

check package.json ![dependencies](https://github.com/JuhoKang/bigpicture-light/network/dependencies)

## License
bigpicture-light is licensed under the MIT license.

```
The MIT License (MIT)

Copyright (c) 2018 Juho Kang, korsejong

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Juho Kang
korsejong
