---
identifier: test-video-name-remote
tags:
    - test
    - video
---

> This is for the S3 link plugin testing. In this test we specifically test what kind of characters are allowed for objectKeys in AWS S3.

> [!Info]
> Some of the Test examples are intended to fail to demonstrate what works and what doesn't. Tests that are expected to fail are clearly marked.

### HTML Embed

#### HTML Embed Spaces

> [!Check] Expected to Work

<video src="s3-sign:videos/s3 video html embed test mp4 space.mp4" />

#### HTML Embed Special Characters

> [!Check] Expected to Work

<video src="s3-sign:videos/s3_video_html_embed_test_mp4_special_characters_!@#$%^&()-_+={}[]~'.mp4" />

#### HTML Embed Underscore

> [!Check] Expected to Work

<video src="s3-sign:videos/s3_video_html_embed_test_mp4_underscore.mp4" />

#### HTML Embed Hyphen

> [!Check] Expected to Work

<video src="s3-sign:videos/s3_video_html_embed_test_mp4_hyphen.mp4" />

#### HTML Embed Upper Lower Case

> [!Check] Expected to Work

<video src="s3-sign:videos/s3_Video_Html_Embed_Test_mp4_Upper_Lower_Case.mp4" />

### Obsidian File Embed

#### Obsidian File Embed Spaces

> [!Check] Expected to Work

![[s3-sign:videos/s3 video obsidian file embed test mp4 space.mp4]]

#### Obsidian File Embed Special Characters

> [!Check] Expected to Work

![[s3-sign:videos/s3_video_obsidian_file_embed_test_mp4_special_characters_!@#$%^&()-_+={}[]~'.mp4]]

#### Obsidian File Embed Underscore

> [!Check] Expected to Work

![[s3-sign:videos/s3_video_obsidian_file_embed_test_mp4_underscore.mp4]]

#### Obsidian File Embed Hyphen

> [!Check] Expected to Work

![[s3-sign:videos/s3_video_obsidian_file_embed_test_mp4_hyphen.mp4]]

#### Obsidian File Embed Upper Lower Case

> [!Check] Expected to Work

![[s3-sign:videos/s3_Video_Obsidian_File_Embed_Test_mp4_Upper_Lower_Case.mp4]]
