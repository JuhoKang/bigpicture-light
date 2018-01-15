# bigpicture-light

**bigpicture-light** is a Web-Based Large-Scale Drawing & Communication Application.

> bigpicture-light provides a large playground to draw and chat with each other online.

Consumer demand for contents are increasing. Traditionaly text, video, image sharing is the basic way for Social networking and sharing. Big-picture project tries to find a way to share with other people with their own drawing. Drawing unique pictures together with different users across the net will create a new sense of Internet culture.

## Overview

preparing

## Features
* Real-time drawing
* Free space to draw on (4096x4096x32 of space with no zoom 1:1)
* Free zoom in, out. drawing based on vector image
* Undo what you draw in real time
* Simple chatting with other people based on user coordinates
* Simple brush change settings
* Simple map to show where you are

## Installation and Settings

#### Build Requirements

* `node 6.11.3+`

#### Installation

    git clone https://github.com/JuhoKang/bigpicture-light.git
    cd bigpicture-light 
    npm install
    DEBUG=big-picture:* npm run devstart

you need cairo for node-canvas dependency

    $ sudo apt-get update 
    $ sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++
    
## Third Party Libraries

check package.json

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
