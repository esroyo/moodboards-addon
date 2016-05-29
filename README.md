# moodboards-addon
Make moodboards quickly by collecting images through the Firefox contextual menu

**This is alpha software, please don't use it as a production tool.**

## Usage
The addon adds new icon in the toolbar which gives acces to the Moodboards tab.

To add images to a moodboard, you'll find an option in the right click contextual menu (similar to "Save image as...") called "Add Image to moodboard".

The creation of moodboards is handled from that same contextual menu.

The moodboard editor is quite limited, just click an image to bring it to the front and press `delete` key while it is selected to remove it.

## Install
* [Firefox extension package](https://esroyo.github.io/moodboards-addon/files/addon/versions/moodboards-addon-0.2.0-fx.xpi)

## Build from source
Requires: `bower`, `npm` and `jpm`.

1. `git clone --depth 1 https://github.com/esroyo/moodboards-addon.git`
2. `cd moodboards-addon`
2. `bower install`
3. `npm install`
4. `jpm run` or `jpm run -b /path/to/your/firefox`

## Resources
* [Getting started with JPM](https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Getting_Started_%28jpm%29)
