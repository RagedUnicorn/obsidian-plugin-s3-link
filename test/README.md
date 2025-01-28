# 🪨 obsidian-plugin-s3-link Test

> All the documentation relevant to testing the plugin

## Resources

Resources for testing in the test vault are generated with `ffmpeg`

### Generate Audio

Example commands for generating all supported audio file formats with ffmpeg.

#### 3GP

```shell
ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "amix=inputs=3:duration=first" -c:a aac -b:a 64k -f 3gp s3_audio_test_file.3gp
```

#### Flac

```shell
ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "amix=inputs=3:duration=first" -c:a flac s3_audio_test_file.flac
```

#### M4A(AAC)

```shell
ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "amix=inputs=3:duration=first" -c:a aac -b:a 192k s3_audio_test_file.m4a
```

#### MP3

```shell
ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "amix=inputs=3:duration=first" -c:a libmp3lame -b:a 192k s3_audio_test_file.mp3
```

#### OGG

```shell
ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "amix=inputs=3:duration=first" -c:a libvorbis -b:a 192k s3_audio_test_file.ogg
```

#### WAV

```shell
ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "amix=inputs=3:duration=first" -c:a pcm_s16le s3_audio_test_file.wav
```

#### WebM

```shell
ffmpeg -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "amix=inputs=3:duration=first" -c:a libopus -b:a 192k s3_audio_test_file.webm
```

### Generate Images

Example commands for generating all supported image file formats with ffmpeg.

#### AVIF

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Test File AVIF':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 -c:v libaom-av1 s3_image_test_file.avif
```

#### BMP

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Test File BMP':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_test_file.bmp
```

#### GIF

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Test File GIF':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_test_file.gif
```

#### JPEG

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Test File JPEG':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_test_file.jpeg
```

#### JPG

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Test File JPG':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_test_file.jpg
```

#### PNG

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Test File PNG':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_test_file.png
```

#### SVG

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Test File SVG':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_test_file.png
magick s3_image_test_file.png s3_image_test_file.svg
```

#### WEBP

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image Test File WEBP':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 -c:v libwebp -q:v 75 s3_image_test_file.webp
```

### Generate Video

Example commands for generating all supported video file formats with ffmpeg.

#### MKV

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720:d=10 -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "[1][2][3]amix=inputs=3:duration=first,volume=3[audio];[0]drawtext=text='S3-Video Test File MKV':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2[v]" -map "[v]" -map "[audio]" -c:v libx264 -c:a aac -b:a 192k s3_video_test_file.mkv
```

#### MOV

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720:d=10 -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "[1][2][3]amix=inputs=3:duration=first,volume=3[audio];[0]drawtext=text='S3-Video Test File MOV':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2[v]" -map "[v]" -map "[audio]" -c:v libx264 -c:a aac -b:a 192k s3_video_test_file.mov
```

#### MP4

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720:d=10 -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "[1][2][3]amix=inputs=3:duration=first,volume=3[audio];[0]drawtext=text='S3-Video Test File MP4':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2[v]" -map "[v]" -map "[audio]" -c:v libx264 -c:a aac -b:a 192k s3_video_test_file.mp4
```

#### OGV

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720:d=10 -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "[1][2][3]amix=inputs=3:duration=first,volume=3[audio];[0]drawtext=text='S3-Video Test File OGV':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2[v]" -map "[v]" -map "[audio]" -c:v libtheora -c:a libvorbis -b:a 192k s3_video_test_file.ogv
```

#### WEBM

```shell
ffmpeg -f lavfi -i color=c=white:s=1280x720:d=10 -f lavfi -i "sine=frequency=440:duration=10" -f lavfi -i "sine=frequency=554.37:duration=10" -f lavfi -i "sine=frequency=659.25:duration=10" -filter_complex "[1][2][3]amix=inputs=3:duration=first,volume=3[audio];[0]drawtext=text='S3-Video Test File WEBM':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2[v]" -map "[v]" -map "[audio]" -c:v libvpx -c:a libvorbis -b:a 192k s3_video_test_file.webm
```

## License

MIT License

Copyright (c) 2025 Michael Wiesendanger

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
