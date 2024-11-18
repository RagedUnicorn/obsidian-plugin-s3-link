Document this setup and explain that backend is locally only because this is for test only and we don't have another s3 bucket available to store the state of terraform

## Assets

### Creating Assets

#### Creating Video Assets

The test videos are created with `ffmpeg` and represent a very simple moving text to be able to distinguish and actual video from a still image.

```bash
ffmpeg -f lavfi -i color=c=white:s=1280x720:d=5 -vf "drawtext=text='S3-Video Test X':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2+(10*sin(t*3))" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -t 5 s3_video_test_x.mp4
```

#### Creating Image Assets

`ffmpeg` can also be used to generate the images for testing.

**PNG**

```bash
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image PNG Test 1':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_test_png_1.png
```

**JPG**

```bash
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-Image JPG Test 1':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_image_test_jpg_1.jpg
```

#### Creating PDFs

Url: https://imagemagick.org/script/download.php

**Create an image with `ffmpeg`**

```bash
ffmpeg -f lavfi -i color=c=white:s=1280x720 -vf "drawtext=text='S3-PDF Test 1':fontcolor=black:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 s3_pdf_test_1.png
```

**Converting the image with `magick` to a pdf**

```bash
magick s3_pdf_test_1.png s3_pdf_test_1.pdf
```

#### Creating Audio

```bash
ffmpeg -f lavfi -i "sine=frequency=220:duration=5" -af "afade=t=in:ss=0:d=1,afade=t=out:st=4:d=1" -c:a pcm_s16le s3_audio_test_1.wav
```
