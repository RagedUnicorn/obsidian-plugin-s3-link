---
identifier: test-audio-name-remote
tags:
    - test
    - audio
---

> This is for the S3 link plugin testing. In this test we specifically test what kind of characters are allowed for objectKeys in AWS S3.

> [!Info]
> Some of the Test examples are intended to fail to demonstrate what works and what doesn't. Tests that are expected to fail are clearly marked.

### HTML Embed

#### HTML Embed Spaces

> [!Check] Expected to Work

<audio src="s3-sign:audio/s3 audio html embed test mp3 space.mp3" />

#### HTML Embed Special Characters

> [!Check] Expected to Work

<audio src="s3-sign:audio/s3_audio_html_embed_test_mp3_special_characters_!@#$%^&()-_+={}[]~'.mp3" />

#### HTML Embed Underscore

> [!Check] Expected to Work

<audio src="s3-sign:audio/s3_audio_html_embed_test_mp3_underscore.mp3" />

#### HTML Embed Hyphen

> [!Check] Expected to Work

<audio src="s3-sign:audio/s3-audio-html-embed-test-mp3-hyphen.mp3" />

#### HTML Embed Upper Lower Case

> [!Check] Expected to Work

<audio src="s3-sign:audio/s3_Audio_Html_Embed_Test_mp3_Upper_Lower_Case.mp3" />

### Obsidian File Embed

#### Obsidian File Embed Space

> [!Check] Expected to Work

![[s3-sign:audio/s3 audio obsidian file embed test mp3 space.mp3]]

#### Obsidian File Embed Special Characters

> [!Check] Expected to Work

![[s3-sign:audio/s3_audio_obsidian_file_embed_test_mp3_special_characters_!@#$%^&()-_+={}[]~'.mp3]]

#### Obsidian File Embed Underscore

> [!Check] Expected to Work

![[s3-sign:audio/s3_audio_obsidian_file_embed_test_mp3_underscore.mp3]]

#### Obsidian File Hyphen

> [!Check] Expected to Work

![[s3-sign:audio/s3-audio-obsidian-file-embed-test-mp3-hyphen.mp3]]

#### Obsidian File Upper Lower Case

> [!Check] Expected to Work

![[s3-sign:audio/s3_Audio_Obsidian_File_Embed_Test_mp3_Upper_Lower_Case.mp3]]
