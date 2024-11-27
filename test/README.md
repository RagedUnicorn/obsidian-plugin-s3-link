# 🪨 obsidian-plugin-s3-link Test

> All the documentation relevant to testing the plugin

## Resources

Resources for testing in the test vault are generated with `ffmpeg`

### Generate Images

#### PNG

##### HTML Embed Test PNG

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image HTML Embed PNG Test 1':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_html_embed_test_png_1.png
```

##### Obsidian Embed Test PNG

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Obsidian Embed PNG Test 1':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_obsidian_embed_test_png_1.png
```

##### Obsidian File Embed Test

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Obsidian File Embed PNG Test 1':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_obsidian_file_embed_test_png_1.png
```

#### JPG

##### HTML Embed Test JPG

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image HTML Embed JPG Test 1':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_html_embed_test_jpg_1.jpg
```

##### Obsidian Embed Test JPG

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Obsidian Embed JPG Test 1':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_obsidian_embed_test_jpg_1.jpg
```

##### Obsidian File Embed Test JPG

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Obsidian File Embed JPG Test 1':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_obsidian_file_embed_test_jpg_1.jpg
```

#### Generate Audio files

TODO

## License

MIT License

Copyright (c) 2024 Michael Wiesendanger

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
